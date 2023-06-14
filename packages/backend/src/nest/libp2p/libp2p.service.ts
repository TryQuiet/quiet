import { gossipsub } from '@chainsafe/libp2p-gossipsub/dist/src'
import { noise } from '@chainsafe/libp2p-noise'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { SocketActionTypes, ConnectionProcessInfo, NetworkStats } from '@quiet/types'
import { log } from 'console'
import { createServer } from 'it-ws/dist/src'
import { Libp2p, createLibp2p } from 'libp2p/dist/src'
import { DateTime } from 'luxon'
import { multiaddr } from 'multiaddr'
import { createLibp2pAddress, createLibp2pListenAddress } from '../../common/utils'
import { InitLibp2pParams, Libp2pNodeParams, ConnectionsManager } from '../../libp2p/connectionsManager'
import { ProcessInChunks } from '../../libp2p/processInChunks'
import { Libp2pEvents } from '../../libp2p/types'
import { webSockets } from '../../libp2p/websocketOverTor'
import { all } from '../../libp2p/websocketOverTor/filters'
import { LocalDBKeys } from '../local-db/local-db.keys'

@Injectable()
export class Libp2pService implements OnModuleInit {
public libp2p: Libp2p
public localAddress: string

// params: InitLibp2pParams
    constructor(params: InitLibp2pParams) {}
    async onModuleInit() {
            const localAddress = this.createLibp2pAddress(params.address, params.peerId.toString())

            this.logger.log(
              `Initializing libp2p for ${params.peerId.toString()}, bootstrapping with ${params.bootstrapMultiaddrs.length} peers`
            )
            this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)
            const nodeParams: Libp2pNodeParams = {
              peerId: params.peerId,
              listenAddresses: [this.createLibp2pListenAddress(params.address)],
              agent: this.socksProxyAgent,
              localAddress: localAddress,
              cert: params.certs.certificate,
              key: params.certs.key,
              ca: params.certs.CA,
              targetPort: params.targetPort
            }
            const libp2p: Libp2p = await ConnectionsManager.createBootstrapNode(nodeParams)

            this.libp2pInstance = libp2p
            const dialInChunks = new ProcessInChunks<string>(params.bootstrapMultiaddrs, this.dialPeer)

            libp2p.addEventListener('peer:discovery', (peer) => {
              this.logger.log(`${params.peerId.toString()} discovered ${peer.detail.id}`)
            })

            libp2p.addEventListener('peer:connect', async (peer) => {
              const remotePeerId = peer.detail.remotePeer.toString()
              this.logger.log(`${params.peerId.toString()} connected to ${remotePeerId}`)

              // Stop dialing as soon as we connect to a peer
              dialInChunks.stop()

              this.connectedPeers.set(remotePeerId, DateTime.utc().valueOf())

              this.emit(Libp2pEvents.PEER_CONNECTED, {
                peers: [remotePeerId]
              })
            })

            libp2p.addEventListener('peer:disconnect', async (peer) => {
              const remotePeerId = peer.detail.remotePeer.toString()
              this.logger.log(`${params.peerId.toString()} disconnected from ${remotePeerId}`)
              this.logger.log(`${libp2p.getConnections().length} open connections`)

              const connectionStartTime = this.connectedPeers.get(remotePeerId)
              if (!connectionStartTime) {
                log.error(`No connection start time for peer ${remotePeerId}`)
                return
              }

              const connectionEndTime: number = DateTime.utc().valueOf()

              const connectionDuration: number = connectionEndTime - connectionStartTime

              this.connectedPeers.delete(remotePeerId)

              // Get saved peer stats from db
              const remotePeerAddress = peer.detail.remoteAddr.toString()
              const peerPrevStats = await this.localDbService.find(LocalDBKeys.PEERS, remotePeerAddress)
              const prev = peerPrevStats?.connectionTime || 0

              const peerStats: NetworkStats = {
                peerId: remotePeerId,
                connectionTime: prev + connectionDuration,
                lastSeen: connectionEndTime
              }

              // Save updates stats to db
              await this.localDbService.update(LocalDBKeys.PEERS, {
                [remotePeerAddress]: peerStats
              })

              this.emit(Libp2pEvents.PEER_DISCONNECTED, {
                peer: remotePeerId,
                connectionDuration,
                lastSeen: connectionEndTime
              })
            })

            await dialInChunks.process()

            this.logger.log(`Initialized libp2p for peer ${params.peerId.toString()}`)

            return {
              libp2p,
              localAddress
            }
          }

          private dialPeer = async (peerAddress: string) => {
            await this.libp2pInstance?.dial(multiaddr(peerAddress))
          }

          public static readonly createBootstrapNode = async (
            params: Libp2pNodeParams
          ): Promise<Libp2p> => {
            return await this.defaultLibp2pNode(params)
          }

          public readonly createLibp2pAddress = (address: string, peerId: string): string => {
            return createLibp2pAddress(address, peerId)
          }

          public readonly createLibp2pListenAddress = (address: string): string => {
            return createLibp2pListenAddress(address)
          }

          private static readonly defaultLibp2pNode = async (params: Libp2pNodeParams): Promise<any> => {
            let lib: Libp2p

            try {
              lib = await createLibp2p({
                connectionManager: {
                  minConnections: 3,
                  maxConnections: 8,
                  dialTimeout: 120_000,
                  maxParallelDials: 10
                },
                peerId: params.peerId,
                addresses: {
                  listen: params.listenAddresses
                },
                streamMuxers: [mplex()],
                connectionEncryption: [noise()],
                relay: {
                  enabled: false,
                  hop: {
                    enabled: true,
                    active: false
                  }
                },
                transports: [
                  webSockets({
                    filter: all,
                    websocket: {
                      agent: params.agent,
                      cert: params.cert,
                      key: params.key,
                      ca: params.ca
                    },
                    localAddress: params.localAddress,
                    targetPort: params.targetPort,
                    createServer: createServer
                  })],
                // @ts-ignore
                dht: kadDHT(),
                pubsub: gossipsub({ allowPublishToZeroPeers: true }),
              })
            } catch (err) {
              this.logger.error('Create libp2p:', err)
              throw err
            }
            return lib
          }
    }
