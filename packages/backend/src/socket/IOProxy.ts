import { Response } from 'node-fetch'
import SocketIO from 'socket.io'
import CommunitiesManager from '../communities/manager'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { CertificateRegistration } from '../registration'
import { Storage } from '../storage'
import {
  ChannelMessage,
  IncomingMessages,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  RegisterOwnerCertificatePayload,
  RegisterUserCertificatePayload,
  SaveCertificatePayload,
  SaveOwnerCertificatePayload,
  SocketActionTypes,
  SubscribeToTopicPayload,
  ChannelMessagesIdsResponse,
  CreatedChannelResponse,
  ChannelsReplicatedPayload,
  SendCertificatesResponse,
  ErrorMessages,
  Community,
  NetworkData,
  ResponseCreateNetworkPayload,
  ErrorCodes,
  AskForMessagesPayload,
  FileMetadata,
  SetChannelSubscribedPayload,
  DownloadStatus,
  RemoveDownloadStatus,
  UpdatePeerListPayload
} from '@quiet/state-manager'
import { emitError } from './errors'

import logger from '../logger'
import { getUsersAddresses } from '../common/utils'

const log = logger('io')

export default class IOProxy {
  io: SocketIO.Server
  connectionsManager: ConnectionsManager
  communities: CommunitiesManager

  constructor(connectionsManager: ConnectionsManager) {
    this.connectionsManager = connectionsManager
    this.io = connectionsManager.io
    this.communities = new CommunitiesManager(connectionsManager)
  }

  public getStorage(peerId: string): Storage {
    try {
      return this.communities.getStorage(peerId)
    } catch (e) {
      emitError(this.io, { type: 'general', message: 'Community does not exist' })
      throw e
    }
  }

  public async closeAll(): Promise<void> {
    await this.communities.stopRegistrars()
    await this.communities.closeStorages()
    if (this.connectionsManager.tor) {
      await this.connectionsManager.tor.kill()
    }
    this.io.close()
  }

  public subscribeToTopic = async (payload: SubscribeToTopicPayload) => {
    log(`${payload.peerId} is subscribing to channel ${payload.channel.address}`)
    await this.getStorage(payload.peerId).subscribeToChannel(payload.channel)
  }

  public setChannelSubscribed = (payload: SetChannelSubscribedPayload) => {
    this.io.emit(SocketActionTypes.CHANNEL_SUBSCRIBED, payload)
  }

  public askForMessages = async (payload: AskForMessagesPayload) => {
    const messages = await this.getStorage(payload.peerId).askForMessages(
      payload.channelAddress,
      payload.ids
    )
  }

  public sendMessage = async (peerId: string, message: ChannelMessage): Promise<void> => {
    await this.getStorage(peerId).sendMessage(message)
  }

  public uploadFile = async (peerId: string, metadata: FileMetadata) => {
    await this.getStorage(peerId).uploadFile(metadata)
  }

  public uploadedFile = (payload: FileMetadata) => {
    this.io.emit(SocketActionTypes.UPLOADED_FILE, payload)
  }

  public downloadFile = async (peerId: string, metadata: FileMetadata) => {
    await this.getStorage(peerId).downloadFile(metadata)
  }

  public cancelDownload = async (peerId: string, mid: string) => {
    await this.getStorage(peerId).cancelDownload(mid)
  }

  public updateDownloadProgress = (payload: DownloadStatus) => {
    this.io.emit(SocketActionTypes.DOWNLOAD_PROGRESS, payload)
  }

  public removeDownloadStatus = (payload: RemoveDownloadStatus) => [
    this.io.emit(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, payload)
  ]

  public updateMessageMedia = (metadata: FileMetadata) => {
    this.io.emit(SocketActionTypes.UPDATE_MESSAGE_MEDIA, metadata)
  }

  // DMs

  public initializeConversation = async (
    peerId: string,
    address: string,
    encryptedPhrase: string
  ): Promise<void> => {
    await this.getStorage(peerId).initializeConversation(address, encryptedPhrase)
  }

  public getPrivateConversations = async (peerId: string): Promise<void> => {
    await this.getStorage(peerId).getPrivateConversations()
  }

  public sendDirectMessage = async (
    peerId: string,
    channelAddress: string,
    messagePayload: string
  ): Promise<void> => {
    await this.getStorage(peerId).sendDirectMessage(channelAddress, messagePayload)
  }

  public subscribeToDirectMessageThread = async (
    peerId: string,
    address: string
  ): Promise<void> => {
    await this.getStorage(peerId).subscribeToDirectMessageThread(address)
  }

  public subscribeToAllConversations = async (
    peerId: string,
    conversations: string[]
  ): Promise<void> => {
    await this.getStorage(peerId).subscribeToAllConversations(conversations)
  }

  public loadCertificates = (payload: SendCertificatesResponse) => {
    log(`Sending ${payload.certificates.length} certificates`)
    this.io.emit(SocketActionTypes.RESPONSE_GET_CERTIFICATES, payload)
  }

  public loadPublicChannels = (payload: ChannelsReplicatedPayload) => {
    log(`Sending ${Object.keys(payload.channels).length} public channels`)
    this.io.emit(SocketActionTypes.CHANNELS_REPLICATED, payload)
  }

  public loadMessages = (payload: IncomingMessages) => {
    log('Emitting message')
    this.io.emit(SocketActionTypes.INCOMING_MESSAGES, payload)
  }

  public sendMessagesIds = (payload: ChannelMessagesIdsResponse) => {
    if (payload.ids.length === 0) {
      return
    }
    log(`Sending ${payload.ids.length} messages ids`)
    this.io.emit(SocketActionTypes.SEND_MESSAGES_IDS, payload)
  }

  public createdChannel = (payload: CreatedChannelResponse) => {
    log(`Created channel ${payload.channel.address}`)
    this.io.emit(SocketActionTypes.CREATED_CHANNEL, payload)
  }

  public loadAllDirectMessages = (messages: string[], channelAddress: string) => {
    if (messages.length === 0) {
      return
    }
    log(`Sending ${messages.length} direct messages`)
    this.io.emit(SocketActionTypes.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, {
      channelAddress,
      messages
    })
  }

  public loadAllPrivateConversations = payload => {
    this.io.emit(SocketActionTypes.RESPONSE_GET_PRIVATE_CONVERSATIONS, payload)
  }

  public registerOwnerCertificate = async (payload: RegisterOwnerCertificatePayload) => {
    const cert = await CertificateRegistration.registerOwnerCertificate(
      payload.userCsr.userCsr,
      payload.permsData
    )
    log(`Saved owner certificate for community ${payload.communityId}`)
    this.io.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
      communityId: payload.communityId,
      network: { certificate: cert, peers: [] }
    })
  }

  public saveOwnerCertificate = async (payload: SaveOwnerCertificatePayload) => {
    const saveCertificatePayload: SaveCertificatePayload = {
      certificate: payload.certificate,
      rootPermsData: payload.permsData
    }
    await this.getStorage(payload.peerId).saveCertificate(saveCertificatePayload)
  }

  private getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }

  public registerUserCertificate = async (payload: RegisterUserCertificatePayload) => {
    let response: Response = null
    
    function resolveTimeout(func, delay: number) {
      return new Promise(
        (resolve, reject) => setTimeout(async () => {
          console.log(`Resolving request after ${delay}ms`)
          try {
            resolve(await func)
          } catch (e) {
            reject('e.message')
          }
        }, delay)
      );
    }

    const requests = []
    // for (let i=0; i < 10; i++) {
    //   requests.push(resolveTimeout(this.connectionsManager.sendCertificateRegistrationRequest(
    //     payload.serviceAddress,
    //     payload.userCsr,
    //     i
    //   ), this.getRandomInt(500, 2000)))
    // }
    for (let i=0; i < 5; i++) {
      requests.push(this.connectionsManager.sendCertificateRegistrationRequest(
        payload.serviceAddress,
        payload.userCsr,
        i
      ))
    }
    try {
      // @ts-ignore
      response = await Promise.any(requests)
    } catch (e) {
      log('No promise fulfilled', e)
      emitError(this.io, {
        type: SocketActionTypes.REGISTRAR,
        code: ErrorCodes.SERVICE_UNAVAILABLE,
        message: ErrorMessages.REGISTRAR_CONNECTION_FAILED,
        community: payload.communityId
      })
      return
    }
    // const requestsInterval = setInterval(async () => {
    //   try {
    //     response = await this.connectionsManager.sendCertificateRegistrationRequest(
    //       payload.serviceAddress,
    //       payload.userCsr
    //     )
    //   } catch (e) {
    //     emitError(this.io, {
    //       type: SocketActionTypes.REGISTRAR,
    //       code: ErrorCodes.SERVICE_UNAVAILABLE,
    //       message: ErrorMessages.REGISTRAR_CONNECTION_FAILED,
    //       community: payload.communityId
    //     })
    //     return
    //   }
    //   if (response) {
    //     log('GOT IT')
    //     clearInterval(requestsInterval)
    //   }
    // }, 1000)

    if (!response) return
    
    log(`Registrar ${payload.communityId} response status: ${response.status}`)
    switch (response.status) {
      case 200:
        break
      case 400:
        emitError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.BAD_REQUEST,
          message: ErrorMessages.INVALID_USERNAME,
          community: payload.communityId
        })
        return
      case 403:
        emitError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.FORBIDDEN,
          message: ErrorMessages.USERNAME_TAKEN,
          community: payload.communityId
        })
        return
      case 404:
        emitError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.NOT_FOUND,
          message: ErrorMessages.REGISTRAR_NOT_FOUND,
          community: payload.communityId
        })
        return
      default:
        log.error(
          `Registrar responded with ${response.status} "${response.statusText}" (${payload.communityId})`
        )
        emitError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          code: ErrorCodes.SERVER_ERROR,
          message: ErrorMessages.REGISTRATION_FAILED,
          community: payload.communityId
        })
        return
    }

    const registrarResponse: { certificate: string; peers: string[]; rootCa: string } =
      await response.json()

    log(`Sending user certificate (${payload.communityId})`)
    this.io.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
      communityId: payload.communityId,
      payload: registrarResponse
    })
  }

  public async createNetwork(community: Community) {
    let network: NetworkData
    try {
      network = await this.connectionsManager.createNetwork()
    } catch (e) {
      log.error(`Creating network for community ${community.id} failed`, e)
      emitError(this.io, {
        type: SocketActionTypes.NETWORK,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: community.id
      })
      return
    }
    log(`Sending network data for ${community.id}`)
    const payload: ResponseCreateNetworkPayload = {
      community,
      network
    }
    this.io.emit(SocketActionTypes.NETWORK, payload)
  }

  public async createCommunity(payload: InitCommunityPayload) {
    await this.launchCommunity(payload)
    log(`Created and launched community ${payload.id}`)
    this.io.emit(SocketActionTypes.NEW_COMMUNITY, { id: payload.id })
  }

  public async launchCommunity(payload: InitCommunityPayload) {
    const community = this.communities.getCommunity(payload.peerId.id)
    if (community) return
    try {
      await this.communities.launch(payload)
    } catch (e) {
      log(`Couldn't launch community for peer ${payload.peerId.id}.`, e)
      emitError(this.io, {
        type: SocketActionTypes.COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: payload.id
      })
      return
    }
    log(`Launched community ${payload.id}`)
    this.io.emit(SocketActionTypes.COMMUNITY, { id: payload.id })
  }

  public async updatePeersList(payload: UpdatePeerListPayload) {
    const community = this.communities.getCommunity(payload.peerId)
    if (!community) return
    const allUsers = community.storage.getAllUsers()
    const peers = await getUsersAddresses(allUsers)
    if (peers.length === 0) return
    this.io.emit(SocketActionTypes.PEER_LIST, { communityId: payload.communityId, peerList: peers })
    log(`Updated peers list (${peers.length})`)
  }

  public async launchRegistrar(payload: LaunchRegistrarPayload) {
    const registrar = await this.communities.setupRegistrationService(
      payload.peerId,
      this.getStorage(payload.peerId),
      {
        certificate: payload.rootCertString,
        privKey: payload.rootKeyString
      },
      payload.privateKey,
      payload.port
    )
    if (!registrar) {
      emitError(this.io, {
        type: SocketActionTypes.REGISTRAR,
        message: ErrorMessages.REGISTRAR_LAUNCH_FAILED,
        community: payload.id
      })
    } else {
      log(`Launched registrar for ${payload.id}`)
      this.io.emit(SocketActionTypes.REGISTRAR, {
        id: payload.id,
        peerId: payload.peerId,
        payload: registrar.getHiddenServiceData()
      })
    }
  }
}
