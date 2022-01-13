import { Response } from 'node-fetch'
import SocketIO from 'socket.io'
import PeerId from 'peer-id'
import { CertsData, DataFromPems, IChannelInfo, IMessage } from '../common/types'
import CommunitiesManager from '../communities/manager'
import { ConnectionsManager } from '../libp2p/connectionsManager'
import { CertificateRegistration } from '../registration'
import { Storage } from '../storage'
import { SocketActionTypes } from '@zbayapp/nectar'
import { emitServerError, emitValidationError } from './errors'
import { loadAllMessages } from './events/messages'
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

  public subscribeToTopic = async (peerId: string, channelData: IChannelInfo) => {
    log(`${peerId} is subscribing to channel ${channelData.address}`)
    await this.getStorage(peerId).subscribeToChannel(channelData)
  }

  public askForMessages = async (
    peerId: string,
    channelAddress: string,
    ids: string[],
    communityId
  ) => {
    const messages = await this.getStorage(peerId).askForMessages(channelAddress, ids)
    loadAllMessages(this.io, messages.filteredMessages, messages.channelAddress, communityId)
  }

  public loadAllMessages = async (peerId: string, channelAddress: string) => {
    this.getStorage(peerId).loadAllChannelMessages(channelAddress)
  }

  public saveCertificate = async (peerId: string, certificate: string) => {
    await this.getStorage(peerId).saveCertificate(certificate)
  }

  public sendMessage = async (
    peerId: string,
    channelAddress: string,
    messagePayload: IMessage
  ): Promise<void> => {
    const { id, type, signature, createdAt, message, pubKey } = messagePayload
    const messageToSend = {
      id,
      type,
      signature,
      createdAt,
      message,
      channelId: channelAddress,
      pubKey
    }
    await this.getStorage(peerId).sendMessage(channelAddress, messageToSend)
  }

  // DMs

  public addUser = async (peerId: string, publicKey: string, halfKey: string): Promise<void> => {
    log(`CONNECTIONS MANAGER: addUser - publicKey ${publicKey} and halfKey ${halfKey}`)
    await this.getStorage(peerId).addUser(publicKey, halfKey)
  }

  public initializeConversation = async (
    peerId: string,
    address: string,
    encryptedPhrase: string
  ): Promise<void> => {
    log(`INSIDE WAGGLE: ${encryptedPhrase}`)
    await this.getStorage(peerId).initializeConversation(address, encryptedPhrase)
  }

  public getAvailableUsers = async (peerId: string): Promise<void> => {
    await this.getStorage(peerId).getAvailableUsers()
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

  public registerOwnerCertificate = async (
    communityId: string,
    userCsr: string,
    dataFromPerms: DataFromPems
  ) => {
    const cert = await CertificateRegistration.registerOwnerCertificate(userCsr, dataFromPerms)
    this.io.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, {
      id: communityId,
      payload: { certificate: cert, peers: [], rootCa: dataFromPerms.certificate }
    })
  }

  public saveOwnerCertificate = async (peerId: string, certificate: string, dataFromPerms) => {
    await this.getStorage(peerId).saveCertificate(certificate, dataFromPerms)
  }

  public registerUserCertificate = async (
    serviceAddress: string,
    userCsr: string,
    communityId: string
  ) => {
    let response: Response
    try {
      response = await this.connectionsManager.sendCertificateRegistrationRequest(
        serviceAddress,
        userCsr
      )
    } catch (e) {
      emitServerError(this.io, {
        type: SocketActionTypes.REGISTRAR,
        message: 'Connecting to registrar failed',
        communityId
      })
      return
    }

    switch (response.status) {
      case 200:
        break
      case 403:
        emitValidationError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          message: 'Username already taken.',
          communityId
        })
        return
      case 400:
        emitValidationError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          message: 'Username is not valid',
          communityId
        })
        return
      default:
        log.error(
          `Registrar responded with ${response.status} "${response.statusText}" (${communityId})`
        )
        emitServerError(this.io, {
          type: SocketActionTypes.REGISTRAR,
          message: 'Registering username failed.',
          communityId
        })
        return
    }
    const registrarResponse: { certificate: string; peers: string[]; rootCa: string } =
      await response.json()
    this.io.emit(SocketActionTypes.SEND_USER_CERTIFICATE, {
      id: communityId,
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
        message: 'Creating network failed',
        communityId
      })
      return
    }
    this.io.emit(SocketActionTypes.NETWORK, { id: communityId, payload: network })
  }

  public async createCommunity(
    communityId: string,
    peerId: PeerId.JSONPeerId,
    hiddenService: { address: string; privateKey: string },
    certs: CertsData
  ) {
    await this.launchCommunity(communityId, peerId, hiddenService, [], certs)
    this.io.emit(SocketActionTypes.NEW_COMMUNITY, { id: communityId })
  }

  public async launchCommunity(
    communityId: string,
    peerId: PeerId.JSONPeerId,
    hiddenService: { address: string; privateKey: string },
    bootstrapMultiaddress: string[],
    certs: CertsData
  ) {
    try {
      await this.communities.launch(
        peerId,
        hiddenService.privateKey,
        bootstrapMultiaddress,
        certs,
        communityId
      )
    } catch (e) {
      log(`Couldn't launch community for peer ${peerId.id}. Error:`, e)
      emitServerError(this.io, {
        type: SocketActionTypes.COMMUNITY,
        message: 'Could not launch community',
        communityId
      })
      return
    }
    this.io.emit(SocketActionTypes.COMMUNITY, { id: communityId })
  }

  public async launchRegistrar(
    communityId: string,
    peerId: string,
    rootCertString: string,
    rootKeyString: string,
    hiddenServicePrivKey?: string,
    port?: number
  ) {
    const registrar = await this.communities.setupRegistrationService(
      peerId,
      this.getStorage(peerId),
      {
        certificate: rootCertString,
        privKey: rootKeyString
      },
      hiddenServicePrivKey,
      port
    )
    if (!registrar) {
      emitServerError(this.io, {
        type: 'registrar',
        message: 'Could not launch registrar',
        communityId
      })
    } else {
      this.io.emit(SocketActionTypes.REGISTRAR, {
        id: communityId,
        peerId,
        payload: registrar.getHiddenServiceData()
      })
    }
  }
}
