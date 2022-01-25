import { Response } from 'node-fetch'
import SocketIO from 'socket.io'
import CommunitiesManager from '../communities/manager'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { CertificateRegistration } from '../registration'
import { Storage } from '../storage'
import {
  AskForMessagesPayload,
  ChannelMessage,
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
  FetchAllMessagesResponse,
  GetPublicChannelsResponse,
  OnMessagePostedResponse,
  SendCertificatesResponse
} from '@zbayapp/nectar'
import { emitServerError, emitValidationError } from './errors'
import { ErrorMessages } from '@zbayapp/nectar'
import logger from '../logger'

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
      emitServerError(this.io, { type: 'general', message: 'Community does not exist' })
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
    log(`${payload.peerId} is subscribing to channel ${payload.channelData.address}`)
    await this.getStorage(payload.peerId).subscribeToChannel(payload.channelData)
  }

  public askForMessages = async (payload: AskForMessagesPayload) => {
    const messages = await this.getStorage(payload.peerId).askForMessages(
      payload.channelAddress,
      payload.ids
    )
    this.loadAllMessages({
      messages: messages.filteredMessages,
      channelAddress: messages.channelAddress,
      communityId: payload.communityId
    })
  }

  public sendMessage = async (
    peerId: string,
    message: ChannelMessage
  ): Promise<void> => {
    await this.getStorage(peerId).sendMessage(message)
  }

  // DMs

  public initializeConversation = async (
    peerId: string,
    address: string,
    encryptedPhrase: string
  ): Promise<void> => {
    log(`INSIDE WAGGLE: ${encryptedPhrase}`)
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

  public loadPublicChannels = (payload: GetPublicChannelsResponse) => {
    log(`Sending ${Object.keys(payload.channels).length} public channels`)
    this.io.emit(SocketActionTypes.RESPONSE_GET_PUBLIC_CHANNELS, payload)
  }

  public loadAllMessages = (payload: FetchAllMessagesResponse) => {
    if (payload.messages.length === 0) {
      return
    }
    log(`Sending ${payload.messages.length} messages`)
    this.io.emit(SocketActionTypes.RESPONSE_FETCH_ALL_MESSAGES, payload)
  }

  public loadMessage = (payload: OnMessagePostedResponse) => {
    log('Emitting message')
    this.io.emit(SocketActionTypes.MESSAGE, payload)
  }

  public sendMessagesIds = (payload: ChannelMessagesIdsResponse) => {
    if (payload.ids.length === 0) {
      return
    }
    log(`Sending ${payload.ids.length} messages ids`)
    this.io.emit(SocketActionTypes.SEND_IDS, payload)
  }

  public createdChannel = (payload: CreatedChannelResponse) => {
    log(`Created channel ${payload.channel.address}`)
    this.io.emit(SocketActionTypes.CREATED_CHANNEL, payload)
  }

  public loadAllDirectMessages = (
    messages: string[],
    channelAddress: string
  ) => {
    if (messages.length === 0) {
      return
    }
    log(`Sending ${messages.length} direct messages`)
    this.io.emit(SocketActionTypes.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, {
      channelAddress,
      messages
    })
  }

  public loadAllPrivateConversations = (payload) => {
    this.io.emit(SocketActionTypes.RESPONSE_GET_PRIVATE_CONVERSATIONS, payload)
  }

  public registerOwnerCertificate = async (payload: RegisterOwnerCertificatePayload) => {
    const cert = await CertificateRegistration.registerOwnerCertificate(
      payload.userCsr,
      payload.permsData
    )
    log(`Saved owner certificate ${payload.id}`)
    this.io.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
      id: payload.id,
      payload: { certificate: cert, peers: [], rootCa: payload.permsData.certificate }
    })
  }

  public saveOwnerCertificate = async (payload: SaveOwnerCertificatePayload) => {
    const saveCertificatePayload: SaveCertificatePayload = {
      certificate: payload.certificate,
      rootPermsData: payload.permsData
    }
    await this.getStorage(payload.peerId).saveCertificate(saveCertificatePayload)
  }

  public registerUserCertificate = async (payload: RegisterUserCertificatePayload) => {
    let response: Response
    try {
      response = await this.connectionsManager.sendCertificateRegistrationRequest(
        payload.serviceAddress,
        payload.userCsr
      )
    } catch (e) {
      emitServerError(this.io, {
        type: SocketActionTypes.REGISTRAR,
        message: ErrorMessages.REGISTRAR_CONNECTION_FAILED,
        communityId: payload.id
      })
      return
    }

    switch (response.status) {
      case 200:
        break
      case 403:
        emitValidationError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          message: ErrorMessages.USERNAME_TAKEN,
          communityId: payload.id
        })
        return
      case 400:
        emitValidationError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          message: ErrorMessages.INVALID_USERNAME,
          communityId: payload.id
        })
        return
      default:
        log.error(
          `Registrar responded with ${response.status} "${response.statusText}" (${payload.id})`
        )
        emitServerError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          message: ErrorMessages.REGISTRATION_FAILED,
          communityId: payload.id
        })
        return
    }
    const registrarResponse: { certificate: string; peers: string[]; rootCa: string } =
      await response.json()

    log(`Sending user certificate (${payload.id})`)
    this.io.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
      id: payload.id,
      payload: registrarResponse
    })
  }

  public async createNetwork(communityId: string) {
    let network
    try {
      network = await this.connectionsManager.createNetwork()
    } catch (e) {
      log.error(`Creating network for community ${communityId} failed`, e)
      emitServerError(this.io, {
        type: SocketActionTypes.NETWORK,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        communityId
      })
      return
    }
    log(`Sending network data for ${communityId}`)
    this.io.emit(SocketActionTypes.NETWORK, { id: communityId, payload: network })
  }

  public async createCommunity(payload: InitCommunityPayload) {
    await this.launchCommunity(payload)
    log(`Created and launched community ${payload.id}`)
    this.io.emit(SocketActionTypes.NEW_COMMUNITY, { id: payload.id })
  }

  public async launchCommunity(payload: InitCommunityPayload) {
    try {
      await this.communities.launch(payload)
    } catch (e) {
      log(`Couldn't launch community for peer ${payload.peerId.id}.`, e)
      emitServerError(this.io, {
        type: SocketActionTypes.COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        communityId: payload.id
      })
      return
    }
    log(`Launched community ${payload.id}`)
    this.io.emit(SocketActionTypes.COMMUNITY, { id: payload.id })
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
      emitServerError(this.io, {
        type: SocketActionTypes.REGISTRAR,
        message: ErrorMessages.REGISTRAR_LAUNCH_FAILED,
        communityId: payload.id
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
