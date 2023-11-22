import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { multiaddr } from '@multiformats/multiaddr'
import { Inject, Injectable } from '@nestjs/common'
import { createLibp2pAddress, createLibp2pListenAddress } from '@quiet/common'
import { ConnectionProcessInfo, PeerId, SocketActionTypes } from '@quiet/types'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { Agent } from 'https'
import { createServer } from 'it-ws'
import { Libp2p, createLibp2p } from 'libp2p'
import { preSharedKey } from 'libp2p/pnet'
import { DateTime } from 'luxon'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Logger from '../common/logger'
import { SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ServerIoProviderTypes } from '../types'
import { webSockets } from '../websocketOverTor'
import { all } from '../websocketOverTor/filters'
import { Libp2pEvents, Libp2pNodeParams } from './libp2p.types'
import { ProcessInChunksService } from './process-in-chunks.service'

const KEY_LENGTH = 32
export const LIBP2P_PSK_METADATA = '/key/swarm/psk/1.0.0/\n/base16/\n'

@Injectable()
export class Libp2pService extends EventEmitter {
    public libp2pInstance: Libp2p | null
    public connectedPeers: Map<string, number> = new Map()
    public dialedPeers: Set<string> = new Set()
    private readonly logger = Logger(Libp2pService.name)
    constructor(
        @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
        @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
        private readonly processInChunksService: ProcessInChunksService<string>
    ) {
        super()
    }

    private dialPeer = async (peerAddress: string) => {
        if (this.dialedPeers.has(peerAddress)) {
            return
        }
        this.dialedPeers.add(peerAddress)
        await this.libp2pInstance?.dial(multiaddr(peerAddress))
    }

    public readonly createLibp2pAddress = (address: string, peerId: string): string => {
        return createLibp2pAddress(address, peerId)
    }

    public readonly createLibp2pListenAddress = (address: string): string => {
        return createLibp2pListenAddress(address)
    }

    public static generateLibp2pPSK(key?: string) {
        /**
         * Based on 'libp2p/pnet' generateKey
         *
         * @param key: base64 encoded psk
         */
        let psk
        if (key) {
            psk = Buffer.from(key, 'base64')
        } else {
            psk = crypto.randomBytes(KEY_LENGTH)
        }

        const base16StringKey = uint8ArrayToString(psk, 'base16')
        const fullKey = uint8ArrayFromString(LIBP2P_PSK_METADATA + base16StringKey)
        return { psk: psk.toString('base64'), fullKey }
    }

    public async createInstance(params: Libp2pNodeParams): Promise<Libp2p> {
        if (this.libp2pInstance) {
            return this.libp2pInstance
        }

        let libp2p: Libp2p

        try {
            libp2p = await createLibp2p({
                start: false,
                connectionManager: {
                    minConnections: 3, // TODO: increase?
                    maxConnections: 8, // TODO: increase?
                    dialTimeout: 120_000,
                    maxParallelDials: 10,
                    autoDial: true, // It's a default but let's set it to have explicit information
                },
                peerId: params.peerId,
                addresses: {
                    listen: params.listenAddresses,
                },
                connectionProtector: preSharedKey({
                    psk: params.psk,
                }),
                streamMuxers: [mplex()],
                connectionEncryption: [noise()],
                relay: {
                    enabled: false,
                    hop: {
                        enabled: true,
                        active: false,
                    },
                },
                transports: [
                    webSockets({
                        filter: all,
                        websocket: {
                            agent: params.agent,
                        },
                        localAddress: params.localAddress,
                        targetPort: params.targetPort,
                        createServer: createServer,
                    }),
                ],
                dht: kadDHT(),
                pubsub: gossipsub({ allowPublishToZeroPeers: true }),
            })
        } catch (err) {
            this.logger.error('Create libp2p:', err)
            throw err
        }
        this.libp2pInstance = libp2p
        await this.afterCreation(params.peers, params.peerId)
        return libp2p
    }

    private async afterCreation(peers: string[], peerId: PeerId) {
        if (!this.libp2pInstance) {
            this.logger.error('libp2pInstance was not created')
            throw new Error('libp2pInstance was not created')
        }

        this.logger(`Local peerId: ${peerId.toString()}`)
        this.on(Libp2pEvents.DIAL_PEERS, async (addresses: string[]) => {
            const nonDialedAddresses = addresses.filter(peerAddress => !this.dialedPeers.has(peerAddress))
            this.logger('Dialing', nonDialedAddresses.length, 'addresses')
            this.processInChunksService.updateData(nonDialedAddresses)
            await this.processInChunksService.process()
        })

        this.logger(`Initializing libp2p for ${peerId.toString()}, bootstrapping with ${peers.length} peers`)
        this.serverIoProvider.io.emit(
            SocketActionTypes.CONNECTION_PROCESS_INFO,
            ConnectionProcessInfo.INITIALIZING_LIBP2P
        )
        this.processInChunksService.init(peers, this.dialPeer)

        this.libp2pInstance.addEventListener('peer:discovery', peer => {
            this.logger(`${peerId.toString()} discovered ${peer.detail.id}`)
        })

        this.libp2pInstance.addEventListener('peer:connect', async peer => {
            const remotePeerId = peer.detail.remotePeer.toString()
            const localPeerId = peerId.toString()
            this.logger(`${localPeerId} connected to ${remotePeerId}`)

            this.connectedPeers.set(remotePeerId, DateTime.utc().valueOf())
            this.logger(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)
            this.logger(`${localPeerId} has ${this.libp2pInstance?.getConnections().length} open connections`)

            this.emit(Libp2pEvents.PEER_CONNECTED, {
                peers: [remotePeerId],
            })
            const latency = await this.libp2pInstance?.ping(peer.detail.remoteAddr)
            this.logger(`${localPeerId} ping to ${remotePeerId}. Latency: ${latency}`)
        })

        this.libp2pInstance.addEventListener('peer:disconnect', async peer => {
            const remotePeerId = peer.detail.remotePeer.toString()
            const localPeerId = peerId.toString()
            this.logger(`${localPeerId} disconnected from ${remotePeerId}`)
            if (!this.libp2pInstance) {
                this.logger.error('libp2pInstance was not created')
                throw new Error('libp2pInstance was not created')
            }
            this.logger(`${localPeerId} has ${this.libp2pInstance.getConnections().length} open connections`)

            const connectionStartTime = this.connectedPeers.get(remotePeerId)
            if (!connectionStartTime) {
                this.logger.error(`No connection start time for peer ${remotePeerId}`)
                return
            }

            const connectionEndTime: number = DateTime.utc().valueOf()

            const connectionDuration: number = connectionEndTime - connectionStartTime

            this.connectedPeers.delete(remotePeerId)
            this.logger(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)

            this.emit(Libp2pEvents.PEER_DISCONNECTED, {
                peer: remotePeerId,
                connectionDuration,
                lastSeen: connectionEndTime,
            })
        })

        await this.processInChunksService.process()

        this.logger(`Initialized libp2p for peer ${peerId.toString()}`)
    }

    public async close(): Promise<void> {
        this.logger('Closing libp2p service')
        await this.libp2pInstance?.stop()
        this.libp2pInstance = null
        this.connectedPeers = new Map()
        this.dialedPeers = new Set()
    }
}
