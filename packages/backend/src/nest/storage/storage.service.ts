import { Inject, Injectable } from '@nestjs/common'
import {
  CertFieldsTypes,
  getCertFieldValue,
  keyFromCertificate,
  keyObjectFromString,
  parseCertificate,
  verifySignature,
  verifyUserCert,
} from '@quiet/identity'
import type { IPFS } from 'ipfs-core'
import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import KeyValueStore from 'orbit-db-kvstore'
import path from 'path'
import { EventEmitter } from 'events'
import PeerId from 'peer-id'
import { getCrypto } from 'pkijs'
import { stringToArrayBuffer } from 'pvutils'
import validate from '../validation/validators'
import { CID } from 'multiformats/cid'
import {
  ChannelMessage,
  ConnectionProcessInfo,
  DeleteFilesFromChannelSocketPayload,
  FileMetadata,
  NoCryptoEngineError,
  PublicChannel,
  PushNotificationPayload,
  SaveCertificatePayload,
  SocketActionTypes,
  User,
} from '@quiet/types'
import { isDefined } from '@quiet/common'
import fs from 'fs'
import { IpfsFileManagerService } from '../ipfs-file-manager/ipfs-file-manager.service'
import { IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR } from '../const'
import { IpfsFilesManagerEvents } from '../ipfs-file-manager/ipfs-file-manager.types'
import { LocalDBKeys } from '../local-db/local-db.types'
import { LocalDbService } from '../local-db/local-db.service'
import { LazyModuleLoader } from '@nestjs/core'
import AccessControllers from 'orbit-db-access-controllers'
import { MessagesAccessController } from './MessagesAccessController'
import { createChannelAccessController } from './ChannelsAccessController'
import Logger from '../common/logger'
import { DirectMessagesRepo, IMessageThread, PublicChannelsRepo } from '../common/types'
import { removeFiles, removeDirs, createPaths, getUsersAddresses } from '../common/utils'
import { StorageEvents } from './storage.types'

@Injectable()
export class StorageService extends EventEmitter {
  public channels: KeyValueStore<PublicChannel>
  private messageThreads: KeyValueStore<IMessageThread>
  private certificates: EventStore<string>
  public publicChannelsRepos: Map<string, PublicChannelsRepo> = new Map()
  public directMessagesRepos: Map<string, DirectMessagesRepo> = new Map()
  private publicKeysMap: Map<string, CryptoKey> = new Map()
  private userNamesMap: Map<string, string> = new Map()
  private ipfs: IPFS
  private orbitDb: OrbitDB
  private filesManager: IpfsFileManagerService
  private peerId: PeerId | null = null

  private readonly logger = Logger(StorageService.name)
  constructor(
    private readonly localDbService: LocalDbService,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string,
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly lazyModuleLoader: LazyModuleLoader
  ) {
    super()
  }

  private prepare() {
    this.logger('Initializing storage')
    removeFiles(this.quietDir, 'LOCK')
    removeDirs(this.quietDir, 'repo.lock')

    if (!['android', 'ios'].includes(process.platform)) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }

    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZED_STORAGE)

    this.logger('Initialized storage')
  }

  public async init(peerId: any) {
    this.clean()
    this.prepare()
    this.peerId = peerId
    const { IpfsModule } = await import('../ipfs/ipfs.module')
    const ipfsModuleRef = await this.lazyModuleLoader.load(() => IpfsModule)
    const { IpfsService } = await import('../ipfs/ipfs.service')
    const ipfsService = ipfsModuleRef.get(IpfsService)
    await ipfsService.createInstance(peerId)
    const ipfsInstance = ipfsService?.ipfsInstance
    if (!ipfsInstance) {
      this.logger.error('no ipfs instance')
      throw new Error('no ipfs instance')
    }
    this.ipfs = ipfsInstance

    await this.createOrbitDb(peerId)

    const { IpfsFileManagerModule } = await import('../ipfs-file-manager/ipfs-file-manager.module')
    const ipfsFileManagerModuleRef = await this.lazyModuleLoader.load(() => IpfsFileManagerModule)
    const { IpfsFileManagerService } = await import('../ipfs-file-manager/ipfs-file-manager.service')
    const ipfsFileManagerService = ipfsFileManagerModuleRef.get(IpfsFileManagerService)
    this.filesManager = ipfsFileManagerService

    this.attachFileManagerEvents()
    await this.initDatabases()
  }

  private async createOrbitDb(peerId: PeerId) {
    console.log('createOrbitDb peer id ', peerId)
    const channelsAccessController = createChannelAccessController(peerId, this.orbitDbDir)
    AccessControllers.addAccessController({ AccessController: MessagesAccessController })
    AccessControllers.addAccessController({ AccessController: channelsAccessController })
    // @ts-ignore
    const orbitDb = await OrbitDB.createInstance(this.ipfs, {
      // @ts-ignore
      id: peerId.toString(),
      directory: this.orbitDbDir,
      // @ts-ignore
      AccessControllers,
    })

    this.orbitDb = orbitDb
  }

  public async initDatabases() {
    this.logger('1/6')
    await this.createDbForChannels()
    this.logger('2/6')
    await this.createDbForCertificates()
    this.logger('3/6')
    await this.createDbForMessageThreads()
    this.logger('4/6')
    await this.initAllChannels()
    this.logger('5/6')
    await this.initAllConversations()
    this.logger('6/6')
    this.logger('Initialized DBs')
    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZED_DBS)
  }

  private async __stopOrbitDb() {
    if (this.orbitDb) {
      this.logger('Stopping OrbitDB')
      try {
        await this.orbitDb.stop()
      } catch (err) {
        this.logger.error(`Following error occured during closing orbitdb database: ${err as string}`)
      }
    }
  }

  private async __stopIPFS() {
    if (this.ipfs) {
      this.logger('Stopping IPFS files manager')
      try {
        await this.filesManager.stop()
      } catch (e) {
        this.logger.error('cannot stop filesManager')
      }
      this.logger('Stopping IPFS')
      try {
        await this.ipfs.stop()
      } catch (err) {
        this.logger.error(`Following error occured during closing ipfs database: ${err as string}`)
      }
    }
  }

  public async stopOrbitDb() {
    try {
      if (this.channels) {
        await this.channels.close()
      }
    } catch (e) {
      this.logger.error('channels', e)
    }

    try {
      if (this.certificates) {
        await this.certificates.close()
      }
    } catch (e) {
      this.logger.error('certificates', e)
    }
    await this.__stopOrbitDb()
    await this.__stopIPFS()
  }

  public async updatePeersList() {
    const allUsers = this.getAllUsers()
    const peers = await getUsersAddresses(allUsers)
    const community = await this.localDbService.get(LocalDBKeys.COMMUNITY)
    this.emit(StorageEvents.UPDATE_PEERS_LIST, { communityId: community.id, peerList: peers })
  }

  public async loadAllCertificates() {
    this.logger('Getting all certificates')
    this.emit(StorageEvents.LOAD_CERTIFICATES, {
      certificates: this.getAllEventLogEntries(this.certificates),
    })
  }

  public async createDbForCertificates() {
    this.logger('createDbForCertificates init')
    this.certificates = await this.orbitDb.log<string>('certificates', {
      accessController: {
        write: ['*'],
      },
    })
    this.certificates.events.on('replicate.progress', async (_address, _hash, entry, _progress, _total) => {
      const certificate = entry.payload.value

      const parsedCertificate = parseCertificate(certificate)
      const key = keyFromCertificate(parsedCertificate)

      const username = getCertFieldValue(parsedCertificate, CertFieldsTypes.nickName)
      if (!username) {
        this.logger.error(
          `Certificates replicate.progress: could not parse certificate for field type ${CertFieldsTypes.nickName}`
        )
        return
      }

      this.userNamesMap.set(key, username)
    })
    this.certificates.events.on('replicated', async () => {
      this.logger('REPLICATED: Certificates')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_REPLICATED)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates),
      })
      await this.updatePeersList()
    })
    this.certificates.events.on('write', async (_address, entry) => {
      this.logger('Saved certificate locally')
      this.logger(entry.payload.value)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates),
      })
      await this.updatePeersList()
    })
    this.certificates.events.on('ready', () => {
      this.logger('Loaded certificates to memory')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LOADED_CERTIFICATES)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates),
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.certificates.load({ fetchEntryTimeout: 15000 })
    const allCertificates = this.getAllEventLogEntries(this.certificates)
    this.logger('ALL Certificates COUNT:', allCertificates.length)
    this.logger('STORAGE: Finished createDbForCertificates')
  }

  public async loadAllChannels() {
    this.logger('Getting all channels')
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 2000 })
    this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
      channels: this.channels.all as unknown as { [key: string]: PublicChannel },
    })
  }

  private async createDbForChannels() {
    this.logger('createDbForChannels init')
    this.channels = await this.orbitDb.keyvalue<PublicChannel>('public-channels', {
      accessController: {
        // type: 'channelsaccess',
        write: ['*'],
      },
    })

    this.channels.events.on('write', async (_address, entry) => {
      this.logger('WRITE: Channels')
    })

    this.channels.events.on('replicated', async () => {
      this.logger('REPLICATED: Channels')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CHANNELS_REPLICATED)
      // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
      await this.channels.load({ fetchEntryTimeout: 2000 })

      const channels = Object.values(this.channels.all).map(channel => {
        return this.transformChannel(channel)
      })

      const keyValueChannels: {
        [key: string]: PublicChannel
      } = {}

      channels.forEach(channel => {
        keyValueChannels[channel.id] = channel
      })

      this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
        channels: keyValueChannels,
      })

      channels.forEach(async (channel: PublicChannel) => {
        await this.subscribeToChannel(channel)
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 1000 })
    this.logger('ALL CHANNELS COUNT:', Object.keys(this.channels.all).length)
    this.logger('ALL CHANNELS COUNT:', Object.keys(this.channels.all))
    Object.values(this.channels.all).forEach(async (channel: PublicChannel) => {
      channel = this.transformChannel(channel)
      await this.subscribeToChannel(channel)
    })
    this.logger('STORAGE: Finished createDbForChannels')
  }

  private async createDbForMessageThreads() {
    this.messageThreads = await this.orbitDb.keyvalue<IMessageThread>('msg-threads', {
      accessController: {
        write: ['*'],
      },
    })
    this.messageThreads.events.on(
      'replicated',
      // eslint-disable-next-line
      async () => {
        // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
        await this.messageThreads.load({ fetchEntryTimeout: 2000 })
        const payload = this.messageThreads.all
        // this.io.loadAllPrivateConversations(payload)
        this.emit(StorageEvents.LOAD_ALL_PRIVATE_CONVERSATIONS, payload)
        await this.initAllConversations()
      }
    )
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.messageThreads.load({ fetchEntryTimeout: 2000 })
    this.logger('ALL MESSAGE THREADS COUNT:', Object.keys(this.messageThreads.all).length)
  }

  async initAllChannels() {
    this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
      channels: this.channels.all as unknown as { [key: string]: PublicChannel },
    })
  }

  async initAllConversations() {
    await Promise.all(
      Object.keys(this.messageThreads.all).map(async conversation => {
        if (!this.directMessagesRepos.has(conversation)) {
          await this.createDirectMessageThread(conversation)
        }
      })
    )
  }

  async verifyMessage(message: ChannelMessage): Promise<boolean> {
    const crypto = getCrypto()
    if (!crypto) throw new NoCryptoEngineError()

    const signature = stringToArrayBuffer(message.signature)
    let cryptoKey = this.publicKeysMap.get(message.pubKey)

    if (!cryptoKey) {
      cryptoKey = await keyObjectFromString(message.pubKey, crypto)
      this.publicKeysMap.set(message.pubKey, cryptoKey)
    }

    return await verifySignature(signature, message.message, cryptoKey)
  }

  protected getAllEventLogEntries<T>(db: EventStore<T>): T[] {
    return db
      .iterator({ limit: -1 })
      .collect()
      .map(e => e.payload.value)
  }

  protected getAllEventLogRawEntries<T>(db: EventStore<T>) {
    return db.iterator({ limit: -1 }).collect()
  }

  public async subscribeToChannel(channelData: PublicChannel): Promise<void> {
    let db: EventStore<ChannelMessage>
    // @ts-ignore
    if (channelData.address) {
      // @ts-ignore
      channelData.id = channelData.address
    }
    let repo = this.publicChannelsRepos.get(channelData.id)
    if (repo) {
      db = repo.db
    } else {
      try {
        db = await this.createChannel(channelData)
      } catch (e) {
        this.logger.error(`Can't subscribe to channel ${channelData.id}`, e.message)
        return
      }
      if (!db) {
        this.logger(`Can't subscribe to channel ${channelData.id}`)
        return
      }
      repo = this.publicChannelsRepos.get(channelData.id)
    }

    if (repo && !repo.eventsAttached) {
      this.logger('Subscribing to channel ', channelData.id)

      db.events.on('write', async (_address, entry) => {
        this.logger(`Writing to public channel db ${channelData.id}`)
        const verified = await this.verifyMessage(entry.payload.value)

        this.emit(StorageEvents.LOAD_MESSAGES, {
          messages: [entry.payload.value],
          isVerified: verified,
        })
      })

      db.events.on('replicate.progress', async (address, _hash, entry, progress, total) => {
        this.logger(`progress ${progress as string}/${total as string}. Address: ${address as string}`)
        const messages = this.transformMessages([entry.payload.value])

        const verified = await this.verifyMessage(messages[0])

        const message = messages[0]

        this.emit(StorageEvents.LOAD_MESSAGES, {
          messages: [message],
          isVerified: verified,
        })

        // Display push notifications on mobile
        if (process.env.BACKEND === 'mobile') {
          if (!verified) return

          // Do not notify about old messages
          // @ts-ignore
          if (parseInt(message.createdAt) < parseInt(process.env.CONNECTION_TIME || '')) return

          const username = this.getUserNameFromCert(message.pubKey)
          if (!username) {
            this.logger.error(`Can't send push notification, no username found for public key '${message.pubKey}'`)
            return
          }

          const payload: PushNotificationPayload = {
            message: JSON.stringify(message),
            username: username,
          }

          this.emit(StorageEvents.SEND_PUSH_NOTIFICATION, payload)
        }
      })
      db.events.on('replicated', async address => {
        this.logger('Replicated.', address)
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        const community = await this.localDbService.get(LocalDBKeys.COMMUNITY)
        this.emit(StorageEvents.SEND_MESSAGES_IDS, {
          ids,
          channelId: channelData.id,
          communityId: community.id,
        })
      })
      db.events.on('ready', async () => {
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        const community = await this.localDbService.get(LocalDBKeys.COMMUNITY)
        this.emit(StorageEvents.SEND_MESSAGES_IDS, {
          ids,
          channelId: channelData.id,
          communityId: community.id,
        })
      })
      await db.load()
      repo.eventsAttached = true
    }

    this.logger(`Subscribed to channel ${channelData.id}`)
    this.emit(StorageEvents.SET_CHANNEL_SUBSCRIBED, {
      channelId: channelData.id,
    })
  }

  public transformMessages(msgs: ChannelMessage[]) {
    console.log('---------------- TRANSFORMING MESSAGES ----------------------')
    const messages = msgs.map(msg => {
      console.log('processing message ', msg.id)
      // @ts-ignore
      if (msg.channelAddress) {
        console.log('message before transformation ', msg)
        // @ts-ignore
        msg.channelId = msg.channelAddress
        // @ts-ignore
        delete msg.channelAddress
        console.log('transformed message to new format ', msg)
        return msg
      }
      return msg
    })
    return messages
  }

  public transformChannel(channel: PublicChannel) {
    // @ts-ignore
    if (channel.address) {
      console.log('channel before transformation ', channel)
      // @ts-ignore
      channel.id = channel.address
      // @ts-ignore
      delete channel.address
      console.log('transformed channel to new format ', channel)
      return channel
    }
    return channel
  }

  public async askForMessages(channelId: string, ids: string[]) {
    const repo = this.publicChannelsRepos.get(channelId)
    if (!repo) return
    const messages = this.getAllEventLogEntries<ChannelMessage>(repo.db)
    let filteredMessages: ChannelMessage[] = []
    for (const id of ids) {
      filteredMessages.push(...messages.filter(i => i.id === id))
    }
    filteredMessages = this.transformMessages(filteredMessages)
    this.emit(StorageEvents.LOAD_MESSAGES, {
      messages: filteredMessages,
      isVerified: true,
    })
    const community = await this.localDbService.get(LocalDBKeys.COMMUNITY)
    this.emit(StorageEvents.CHECK_FOR_MISSING_FILES, community.id)
  }

  private async createChannel(data: PublicChannel): Promise<EventStore<ChannelMessage>> {
    console.log('creating channel')
    if (!validate.isChannel(data)) {
      this.logger.error('STORAGE: Invalid channel format')
      throw new Error('Create channel validation error')
    }
    this.logger(`Creating channel ${data.id}`)

    // @ts-ignore
    const channelId = data.id || data.address

    const db: EventStore<ChannelMessage> = await this.orbitDb.log<ChannelMessage>(`channels.${channelId}`, {
      accessController: {
        type: 'messagesaccess',
        write: ['*'],
      },
    })

    const channel = this.channels.get(channelId)
    console.log('channel', channel)
    if (channel === undefined) {
      await this.channels.put(channelId, {
        ...data,
      })
      console.log('emitting new channel')
      this.emit(StorageEvents.CREATED_CHANNEL, {
        channel: data,
      })
    }

    this.publicChannelsRepos.set(channelId, { db, eventsAttached: false })
    this.logger(`Set ${channelId} to local channels`)
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await db.load({ fetchEntryTimeout: 2000 })
    this.logger(`Created channel ${channelId}`)
    return db
  }

  public async deleteChannel(payload: { channelId: string; ownerPeerId: string }) {
    console.log('deleting channel storage', payload)
    const { channelId, ownerPeerId } = payload
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 15000 })
    const channel = this.channels.get(channelId)
    if (!this.peerId) {
      this.logger('deleteChannel - peerId is null')
      throw new Error('deleteChannel - peerId is null')
    }
    const isOwner = ownerPeerId === this.peerId.toString()
    if (channel && isOwner) {
      await this.channels.del(channelId)
    }
    let repo = this.publicChannelsRepos.get(channelId)
    if (!repo) {
      const db = await this.orbitDb.log<ChannelMessage>(`channels.${channelId}`, {
        accessController: {
          type: 'messagesaccess',
          write: ['*'],
        },
      })
      repo = {
        db,
        eventsAttached: false,
      }
    }
    await repo.db.load()
    const allEntries = this.getAllEventLogRawEntries(repo.db)
    await repo.db.close()
    await repo.db.drop()
    const hashes = allEntries.map(e => CID.parse(e.hash))
    const files = allEntries
      .map(e => {
        return e.payload.value.media
      })
      .filter(isDefined)
    // await this.deleteChannelFiles(files)
    // await this.deleteChannelMessages(hashes)
    this.publicChannelsRepos.delete(channelId)
    const responsePayload = { channelId: payload.channelId }
    this.emit(StorageEvents.CHANNEL_DELETION_RESPONSE, responsePayload)
  }

  public async deleteChannelFiles(files: FileMetadata[]) {
    for (const file of files) {
      await this.deleteFile(file)
    }
  }

  public async deleteFile(fileMetadata: FileMetadata) {
    await this.filesManager.deleteBlocks(fileMetadata)
  }

  public async deleteChannelMessages(hashes: CID[]) {
    console.log('hashes ', hashes)
    const gcresult = this.ipfs.repo.gc()
    for await (const res of gcresult) {
      // @ts-ignore
      // const ccc = base58.base58btc.encode(res.cid?.multihash.bytes)
      // console.log('base58btc encoded', ccc)
      // console.log('garbage collector result', res)
    }
    // for await (const result of this.ipfs.block.rm(hashes)) {
    //   if (result.error) {
    //     console.error(`Failed to remove block ${result.cid} due to ${result.error.message}`)
    //   }
    // }
  }

  public async sendMessage(message: ChannelMessage) {
    if (!validate.isMessage(message)) {
      this.logger.error('STORAGE: public channel message is invalid')
      return
    }
    const repo = this.publicChannelsRepos.get(message.channelId)
    if (!repo) {
      this.logger.error(`Could not send message. No '${message.channelId}' channel in saved public channels`)
      return
    }
    try {
      await repo.db.add(message)
    } catch (e) {
      this.logger.error(
        `STORAGE: Could not append message (entry not allowed to write to the log). Details: ${e.message}`
      )
    }
  }

  private attachFileManagerEvents = () => {
    this.filesManager.on(IpfsFilesManagerEvents.UPDATE_DOWNLOAD_PROGRESS, status => {
      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, status)
    })
    this.filesManager.on(IpfsFilesManagerEvents.UPDATE_MESSAGE_MEDIA, messageMedia => {
      this.emit(StorageEvents.UPDATE_MESSAGE_MEDIA, messageMedia)
    })
    this.filesManager.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, payload => {
      this.emit(StorageEvents.REMOVE_DOWNLOAD_STATUS, payload)
    })
    this.filesManager.on(StorageEvents.UPLOADED_FILE, payload => {
      this.emit(StorageEvents.UPLOADED_FILE, payload)
    })
    this.filesManager.on(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, payload => {
      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, payload)
    })
    this.filesManager.on(StorageEvents.UPDATE_MESSAGE_MEDIA, payload => {
      this.emit(StorageEvents.UPDATE_MESSAGE_MEDIA, payload)
    })
  }

  public async uploadFile(metadata: FileMetadata) {
    this.filesManager.emit(IpfsFilesManagerEvents.UPLOAD_FILE, metadata)
  }

  public async downloadFile(metadata: FileMetadata) {
    this.filesManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, metadata)
  }

  public cancelDownload(mid: string) {
    this.filesManager.emit(IpfsFilesManagerEvents.CANCEL_DOWNLOAD, mid)
  }

  public async initializeConversation(address: string, encryptedPhrase: string): Promise<void> {
    if (!validate.isConversation(address, encryptedPhrase)) {
      this.logger.error('STORAGE: Invalid conversation format')
      return
    }
    const db: EventStore<string> = await this.orbitDb.log<string>(`dms.${address}`, {
      accessController: {
        write: ['*'],
      },
    })

    this.directMessagesRepos.set(address, { db, eventsAttached: false })
    await this.messageThreads.put(address, encryptedPhrase)
    await this.subscribeToDirectMessageThread(address)
  }

  public async subscribeToAllConversations(conversations: string[]) {
    await Promise.all(
      conversations.map(async channel => {
        await this.subscribeToDirectMessageThread(channel)
      })
    )
  }

  public async subscribeToDirectMessageThread(channelId: string) {
    let db: EventStore<string>
    let repo = this.directMessagesRepos.get(channelId)

    if (repo) {
      db = repo.db
    } else {
      db = await this.createDirectMessageThread(channelId)
      if (!db) {
        this.logger(`Can't subscribe to direct messages thread ${channelId}`)
        return
      }
      repo = this.directMessagesRepos.get(channelId)
    }

    if (repo && !repo.eventsAttached) {
      this.logger('Subscribing to direct messages thread ', channelId)
      this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
        messages: this.getAllEventLogEntries(db),
        channelId,
      })
      db.events.on('write', (_address, _entry) => {
        this.logger('Writing')
        this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
          messages: this.getAllEventLogEntries(db),
          channelId,
        })
      })
      db.events.on('replicated', () => {
        this.logger('Message replicated')
        this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
          messages: this.getAllEventLogEntries(db),
          channelId,
        })
      })
      db.events.on('ready', () => {
        this.logger('DIRECT Messages thread ready')
      })
      repo.eventsAttached = true
      this.logger('Subscription to channel ready', channelId)
    }
  }

  private async createDirectMessageThread(channelId: string): Promise<EventStore<string>> {
    if (!channelId) {
      this.logger("No channel ID, can't create channel")
      throw new Error("No channel ID, can't create channel")
    }

    this.logger(`creatin direct message thread for ${channelId}`)

    const db: EventStore<string> = await this.orbitDb.log<string>(`dms.${channelId}`, {
      accessController: {
        write: ['*'],
      },
    })
    db.events.on('replicated', () => {
      this.logger('replicated some messages')
    })
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await db.load({ fetchEntryTimeout: 2000 })

    this.directMessagesRepos.set(channelId, { db, eventsAttached: false })
    return db
  }

  public async sendDirectMessage(channelId: string, message: string) {
    if (!validate.isDirectMessage(message)) {
      this.logger.error('STORAGE: Invalid direct message format')
      return
    }
    await this.subscribeToDirectMessageThread(channelId) // Is it necessary? Yes it is atm
    this.logger('STORAGE: sendDirectMessage entered')
    this.logger(`STORAGE: sendDirectMessage channelId is ${channelId}`)
    this.logger(`STORAGE: sendDirectMessage message is ${JSON.stringify(message)}`)
    const db = this.directMessagesRepos.get(channelId)?.db
    if (!db) return
    this.logger(`STORAGE: sendDirectMessage db is ${db.address.root}`)
    this.logger(`STORAGE: sendDirectMessage db is ${db.address.path}`)
    await db.add(message)
  }

  public async getPrivateConversations(): Promise<void> {
    this.logger('STORAGE: getPrivateConversations enetered')
    // @ts-expect-error - OrbitDB's type declaration of `load` arguments lacks 'options'
    await this.messageThreads.load({ fetchEntryTimeout: 2000 })
    const payload = this.messageThreads.all
    this.logger('STORAGE: getPrivateConversations payload payload')
    this.emit(StorageEvents.LOAD_ALL_PRIVATE_CONVERSATIONS, payload)
  }

  public async saveCertificate(payload: SaveCertificatePayload): Promise<boolean> {
    this.logger('About to save certificate...')
    if (!payload.certificate) {
      this.logger('Certificate is either null or undefined, not saving to db')
      return false
    }
    const verification = await verifyUserCert(payload.rootPermsData.certificate, payload.certificate)
    if (verification.resultCode !== 0) {
      this.logger.error('Certificate is not valid')
      this.logger.error(verification.resultMessage)
      return false
    }
    this.logger('Saving certificate...')
    await this.certificates.add(payload.certificate)
    return true
  }

  public getAllUsers(): User[] {
    const certs = this.getAllEventLogEntries(this.certificates)
    const allUsers: User[] = []
    for (const cert of certs) {
      const parsedCert = parseCertificate(cert)
      const onionAddress = getCertFieldValue(parsedCert, CertFieldsTypes.commonName)
      const peerId = getCertFieldValue(parsedCert, CertFieldsTypes.peerId)
      const username = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
      const dmPublicKey = getCertFieldValue(parsedCert, CertFieldsTypes.dmPublicKey)
      if (!onionAddress || !peerId || !username || !dmPublicKey) continue
      allUsers.push({ onionAddress, peerId, username, dmPublicKey })
    }
    return allUsers
  }

  public usernameCert(username: string): string | null {
    /**
     * Check if given username is already in use
     */
    const certificates = this.getAllEventLogEntries(this.certificates)
    for (const cert of certificates) {
      const parsedCert = parseCertificate(cert)
      const certUsername = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
      if (certUsername?.localeCompare(username, 'en', { sensitivity: 'base' }) === 0) {
        return cert
      }
    }
    return null
  }

  public getUserNameFromCert(publicKey: string): string | undefined {
    if (!this.userNamesMap.get(publicKey)) {
      const certificates = this.getAllEventLogEntries(this.certificates)

      for (const cert of certificates) {
        const parsedCertificate = parseCertificate(cert)
        const key = keyFromCertificate(parsedCertificate)

        const value = getCertFieldValue(parsedCertificate, CertFieldsTypes.nickName)
        if (!value) {
          this.logger.error(
            `Get user name from cert: Could not parse certificate for field type ${CertFieldsTypes.nickName}`
          )
          continue
        }
        this.userNamesMap.set(key, value)
      }
    }

    return this.userNamesMap.get(publicKey)
  }

  public async deleteFilesFromChannel(payload: DeleteFilesFromChannelSocketPayload) {
    const { messages } = payload
    Object.keys(messages).map(async key => {
      const message = messages[key]
      if (message?.media?.path) {
        const mediaPath = message.media.path
        this.logger('deleteFilesFromChannel : mediaPath', mediaPath)
        const isFileExist = await this.checkIfFileExist(mediaPath)
        this.logger(`deleteFilesFromChannel : isFileExist- ${isFileExist}`)
        if (isFileExist) {
          fs.unlink(mediaPath, unlinkError => {
            if (unlinkError) {
              this.logger(`deleteFilesFromChannel : unlink error - ${unlinkError}`)
            }
          })
        } else {
          this.logger(`deleteFilesFromChannel : file dont exist - ${mediaPath}`)
        }
      }
    })
  }

  public async checkIfFileExist(filepath: string): Promise<boolean> {
    return await new Promise(resolve => {
      fs.access(filepath, fs.constants.F_OK, error => {
        resolve(!error)
      })
    })
  }

  private clean() {
    // @ts-ignore
    this.channels = undefined
    // @ts-ignore
    this.messageThreads = undefined
    // @ts-ignore
    this.certificates = undefined
    this.publicChannelsRepos = new Map()
    this.directMessagesRepos = new Map()
    this.publicKeysMap = new Map()
    this.userNamesMap = new Map()
    // @ts-ignore
    this.ipfs = null
    // @ts-ignore
    this.orbitDb = null
    // @ts-ignore
    this.filesManager = null
    this.peerId = null
  }

  private async deleteFilesFromTemporaryDir() {
    const temporaryFilesDirectory = path.join(this.quietDir, '/../', 'temporaryFiles')
    fs.readdir(temporaryFilesDirectory, (readDirErr, files) => {
      if (readDirErr) this.logger(`deleteFilesFromTemporaryDir : readdir error - ${readDirErr}`)
      for (const file of files) {
        fs.unlink(path.join(temporaryFilesDirectory, file), unlinkError => {
          if (unlinkError) this.logger(`deleteFilesFromTemporaryDir : unlink error - ${unlinkError}`)
        })
      }
    })
  }
}
