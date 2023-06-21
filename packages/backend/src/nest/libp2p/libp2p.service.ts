import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'

import { Agent } from 'https'
import { createLibp2p, Libp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mplex } from '@libp2p/mplex'
import { kadDHT } from '@libp2p/kad-dht'
import { createServer } from 'it-ws'

import { webSockets } from '../../libp2p/websocketOverTor/index'
import { all } from '../../libp2p/websocketOverTor/filters'

import { DateTime } from 'luxon'
import { EventEmitter } from 'events'
import { InitLibp2pParams, Libp2pEvents, Libp2pNodeParams } from './libp2p.types'
import { ProcessInChunks } from './process-in-chunks'
import { multiaddr } from '@multiformats/multiaddr'
import { ConnectionProcessInfo, CreateChannelPayload, CreatedChannelResponse, DeleteFilesFromChannelSocketPayload, DownloadStatus, ErrorMessages, FileMetadata, IncomingMessages, InitCommunityPayload, LaunchRegistrarPayload, NetworkData, NetworkDataPayload, NetworkStats, PeerId, PushNotificationPayload, RegisterOwnerCertificatePayload, RegisterUserCertificatePayload, RemoveDownloadStatus, ResponseCreateNetworkPayload, SaveCertificatePayload, SaveOwnerCertificatePayload, SendCertificatesResponse, SendMessagePayload, SetChannelSubscribedPayload, SocketActionTypes, StorePeerListPayload, UploadFilePayload } from '@quiet/types'
import { INIT_LIBP2P_PARAMS, LIB_P2P_PROVIDER, PEER_ID_PROVIDER, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ServerIoProviderTypes } from '../types'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { createLibp2pListenAddress } from './libp2p.utils'

@Injectable()
export class Libp2pService extends EventEmitter {
  public localAddress: string
  public libp2pInstance: Libp2p | null
  public connectedPeers: Map<string, number> = new Map()
  private readonly logger = new Logger(Libp2pService.name)
  constructor(
    private readonly localDbService: LocalDbService,
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
    @Inject(PEER_ID_PROVIDER) public readonly peerId: PeerId,
    // @Inject(INIT_LIBP2P_PARAMS) public readonly initParams: InitLibp2pParams,
  ) {
    super()
  }

  private dialPeer = async (peerAddress: string) => {
    await this.libp2pInstance?.dial(multiaddr(peerAddress))
  }

  public readonly createLibp2pAddress = (address: string, peerId: string): string => {
    return this.createLibp2pAddress(address, peerId)
  }

  public readonly createLibp2pListenAddress = (address: string): string => {
    return createLibp2pListenAddress(address)
  }

  public async createInstance(params: Libp2pNodeParams): Promise<any> {
    console.log('eeeeeeeeeeeelllooo')
    if (this.libp2pInstance) {
      return this.libp2pInstance
    }

    let libp2p: Libp2p

    try {
      libp2p = await createLibp2p({
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
        dht: kadDHT(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true }),
      })
    } catch (err) {
      this.logger.error('Create libp2p:', err)
      throw err
    }
    this.libp2pInstance = libp2p
    await this.afterCreation()
    return libp2p
  }

  private async afterCreation() {
    if (!this.libp2pInstance) {
      this.logger.error('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    // this.logger.log(
    //   `Initializing libp2p for ${this.peerId.toString()}, bootstrapping with ${this.bootstrapMultiaddrs.length} peers`
    // )
    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)
    // const dialInChunks = new ProcessInChunks<string>(this.bootstrapMultiaddrs, this.dialPeer)

    this.libp2pInstance.addEventListener('peer:discovery', (peer) => {
      this.logger.log(`${this.peerId.toString()} discovered ${peer.detail.id}`)
    })

    this.libp2pInstance.addEventListener('peer:connect', async (peer) => {
      const remotePeerId = peer.detail.remotePeer.toString()
      this.logger.log(`${this.peerId.toString()} connected to ${remotePeerId}`)

      // Stop dialing as soon as we connect to a peer
      // dialInChunks.stop()

      this.connectedPeers.set(remotePeerId, DateTime.utc().valueOf())

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId]
      })
    })

    this.libp2pInstance.addEventListener('peer:disconnect', async (peer) => {
      const remotePeerId = peer.detail.remotePeer.toString()
      this.logger.log(`${this.peerId.toString()} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.error('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger.log(`${this.libp2pInstance.getConnections().length} open connections`)

      const connectionStartTime = this.connectedPeers.get(remotePeerId)
      if (!connectionStartTime) {
        this.logger.error(`No connection start time for peer ${remotePeerId}`)
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

    // await dialInChunks.process()

    this.logger.log(`Initialized libp2p for peer ${this.peerId.toString()}`)
  }
}