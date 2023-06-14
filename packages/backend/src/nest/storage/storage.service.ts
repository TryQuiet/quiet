import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
    CertFieldsTypes,
    getCertFieldValue,
    keyFromCertificate,
    keyObjectFromString,
    parseCertificate,
    verifySignature,
    verifyUserCert
  } from '@quiet/identity'
  import type { IPFS, create as createType } from 'ipfs-core'
  import { create } from 'ipfs-core'
  import type { Libp2p } from 'libp2p'
  import OrbitDB from 'orbit-db'
  import EventStore from 'orbit-db-eventstore'
  import KeyValueStore from 'orbit-db-kvstore'
  import path from 'path'
  import { EventEmitter } from 'events'
  import PeerId from 'peer-id'
  import { getCrypto } from 'pkijs'
  import AccessControllers from 'orbit-db-access-controllers'
  import { stringToArrayBuffer } from 'pvutils'

  import { CID } from 'multiformats/cid'
  import { ChannelMessage, ConnectionProcessInfo, DeleteFilesFromChannelSocketPayload, FileMetadata, InitCommunityPayload, NoCryptoEngineError, PublicChannel, PushNotificationPayload, SaveCertificatePayload, SocketActionTypes, User } from '@quiet/types'
  import { isDefined } from '@quiet/common'
  import fs from 'fs'
import { validate } from 'class-validator'
import { IMessageThread, PublicChannelsRepo, DirectMessagesRepo, StorageOptions } from '../../common/types'
import { removeFiles, removeDirs, createPaths, getUsersAddresses } from '../../common/utils'
import { Config } from '../../constants'
// import { createChannelAccessController } from '../../storage/ChannelsAccessController'
// import { IpfsipfsFileManagerService, IpfsipfsFileManagerServiceEvents } from '../../storage/ipfsFileManager'
// import { MessagesAccessController } from '../../storage/MessagesAccessController'
import { StorageEvents } from '../../storage/types'
import { IpfsFileManagerService, IpfsFilesManagerEvents } from '../ipfs-file-manager/ipfs-file-manager.service'
import { COMMUNITY_PROVIDER, ORBIT_DB, ORBIT_DB_DIR, ORBIT_DB_PROVIDER, QUIET_DIR } from '../const'
import { createChannelAccessController } from './ChannelsAccessController'

@Injectable()
export class StorageService extends EventEmitter implements OnModuleInit {
  // public quietDir: string
  // public peerId: PeerId
  // protected ipfs: IPFS
  // protected orbitdb: OrbitDB
  public channels: KeyValueStore<PublicChannel>
  private messageThreads: KeyValueStore<IMessageThread>
  private certificates: EventStore<string>
  public publicChannelsRepos: Map<string, PublicChannelsRepo> = new Map()
  public directMessagesRepos: Map<string, DirectMessagesRepo> = new Map()
  private publicKeysMap: Map<string, CryptoKey> = new Map()
  private userNamesMap: Map<string, string> = new Map()
  // public options: StorageOptions
  // public orbitDbDir: string
  // public ipfsRepoPath: string
  // private filesManager: IpfsFilesManager
  // readonly downloadCancellations: string[]
  // private readonly __communityId: string

  private readonly logger = new Logger(StorageService.name)
  constructor(
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(ORBIT_DB_PROVIDER) public readonly orbitDb: OrbitDB,
    @Inject(COMMUNITY_PROVIDER) public readonly community: InitCommunityPayload,
    private readonly filesManager: IpfsFileManagerService
    
    // options?: Partial<StorageOptions>
    ) {
    super()
    // this.quietDir = quietDir
    // this.__communityId = communityId
    // this.options = {
    //   ...new StorageOptions(),
    //   ...options
    // }
    // this.orbitDbDir = path.join(this.quietDir, this.options.orbitDbDir || Config.ORBIT_DB_DIR)
    // this.ipfsRepoPath = path.join(this.quietDir, this.options.ipfsDir || Config.IPFS_REPO_PATH)
  }

  async onModuleInit() {
    this.logger.log('Initializing storage')
    this.peerId = peerID
    removeFiles(this.quietDir, 'LOCK')
    removeDirs(this.quietDir, 'repo.lock')
    if (this.options?.createPaths) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }
    this.ipfs = await this.initIPFS(libp2p, peerID)
    // this.filesManager = new IpfsFilesManager(this.ipfs, this.quietDir)
    this.attachFileManagerEvents()

    // const channelsAccessController = createChannelAccessController(peerID, this.orbitDbDir)

    // AccessControllers.addAccessController({ AccessController: MessagesAccessController })
    // AccessControllers.addAccessController({ AccessController: channelsAccessController })


    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZED_STORAGE)
    this.logger.log('Initialized storage')
  }

  // public async init(libp2p: Libp2p, peerID: PeerId): Promise<void> {
  //   log('Initializing storage')
  //   this.peerId = peerID
  //   removeFiles(this.quietDir, 'LOCK')
  //   removeDirs(this.quietDir, 'repo.lock')
  //   if (this.options?.createPaths) {
  //     createPaths([this.ipfsRepoPath, this.orbitDbDir])
  //   }
  //   this.ipfs = await this.initIPFS(libp2p, peerID)
  //   this.filesManager = new IpfsFilesManager(this.ipfs, this.quietDir)
  //   this.attachFileManagerEvents()

  //   const channelsAccessController = createChannelAccessController(peerID, this.orbitDbDir)

  //   AccessControllers.addAccessController({ AccessController: MessagesAccessController })
  //   AccessControllers.addAccessController({ AccessController: channelsAccessController })

    // this.orbitDb = await OrbitDB.createInstance(this.ipfs, {
    //   // @ts-ignore
    //   id: peerID.toString(),
    //   directory: this.orbitDbDir,
    //   // @ts-ignore
    //   AccessControllers: AccessControllers
    // })
  //   this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZED_STORAGE)
  //   log('Initialized storage')
  // }

  public async initDatabases() {
    this.logger.log('1/6')
    await this.createDbForChannels()
    this.logger.log('2/6')
    await this.createDbForCertificates()
    this.logger.log('3/6')
    await this.createDbForMessageThreads()
    this.logger.log('4/6')
    await this.initAllChannels()
    this.logger.log('5/6')
    await this.initAllConversations()
    this.logger.log('6/6')
    this.logger.log('Initialized DBs')
    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZED_DBS)
  }

  private async __stopOrbitDb() {
    if (this.orbitDb) {
      this.logger.log('Stopping OrbitDB')
      try {
        await this.orbitDb.stop()
      } catch (err) {
        this.logger.error(`Following error occured during closing orbitdb database: ${err as string}`)
      }
    }
  }

  private async __stopIPFS() {
    if (this.ipfs) {
      this.logger.log('Stopping IPFS files manager')
      try {
        await this.filesManager.stop()
      } catch (e) {
        this.logger.error('cannot stop filesManager')
      }
      this.logger.log('Stopping IPFS')
      try {
        await this.ipfs.stop()
      } catch (err) {
        this.logger.error(`Following error occured during closing ipfs database: ${err as string}`)
      }
    }
  }

  public async stopOrbitDb() {
    await this.__stopOrbitDb()
    await this.__stopIPFS()
  }

  // public get communityId() {
  //   return this.__communityId
  // }

  protected async initIPFS(libp2p: any, peerID: any): Promise<IPFS> {
    this.logger.log('Initializing IPFS')
    this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_IPFS)
    return await create({
      libp2p: async () => libp2p,
      preload: { enabled: false },
      repo: this.ipfsRepoPath,
      EXPERIMENTAL: {
        ipnsPubsub: true
      },
      init: {
        privateKey: peerID
      }
    })
  }

  public async updatePeersList() {
    const allUsers = this.getAllUsers()
    const peers = await getUsersAddresses(allUsers)
    this.emit(StorageEvents.UPDATE_PEERS_LIST, { communityId: this.community.id, peerList: peers })
  }

  public async loadAllCertificates() {
    this.logger.log('Getting all certificates')
    this.emit(StorageEvents.LOAD_CERTIFICATES, {
      certificates: this.getAllEventLogEntries(this.certificates)
    })
  }

  public async createDbForCertificates() {
    this.logger.log('createDbForCertificates init')
    this.certificates = await this.orbitDb.log<string>('certificates', {
      accessController: {
        write: ['*']
      }
    })
    this.certificates.events.on(
      'replicate.progress',
      async (_address, _hash, entry, _progress, _total) => {
        const certificate = entry.payload.value

        const parsedCertificate = parseCertificate(certificate)
        const key = keyFromCertificate(parsedCertificate)

        const username = getCertFieldValue(parsedCertificate, CertFieldsTypes.nickName)
        if (!username) {
          this.logger.error(`Certificates replicate.progress: could not parse certificate for field type ${CertFieldsTypes.nickName}`)
          return
        }

        this.userNamesMap.set(key, username)
      }
    )
    this.certificates.events.on('replicated', async () => {
      this.logger.log('REPLICATED: Certificates')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CERTIFICATES_REPLICATED)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates)
      })
      await this.updatePeersList()
    })
    this.certificates.events.on('write', async (_address, entry) => {
      this.logger.log('Saved certificate locally')
      this.logger.log(entry.payload.value)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates)
      })
      await this.updatePeersList()
    })
    this.certificates.events.on('ready', () => {
      this.logger.log('Loaded certificates to memory')
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LOADED_CERTIFICATES)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates)
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.certificates.load({ fetchEntryTimeout: 15000 })
    const allCertificates = this.getAllEventLogEntries(this.certificates)
    this.logger.log('ALL Certificates COUNT:', allCertificates.length)
    this.logger.log('STORAGE: Finished createDbForCertificates')
  }

  public async loadAllChannels() {
    this.logger.log('Getting all channels')
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 2000 })
    this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
      channels: this.channels.all as unknown as { [key: string]: PublicChannel }
    })
  }

  private async createDbForChannels() {
    this.logger.log('createDbForChannels init')
    this.channels = await this.orbitDb.keyvalue<PublicChannel>('public-channels', {
      accessController: {
        // type: 'channelsaccess',
        write: ['*']
      }
    })

    this.channels.events.on('write', async (_address, entry) => {
      this.logger.log('WRITE: Channels')
    })

    this.channels.events.on('replicated', async () => {
      this.logger.log('REPLICATED: Channels')
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
        channels: keyValueChannels
      })

      channels.forEach(async (channel: PublicChannel) => {
        await this.subscribeToChannel(channel)
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 1000 })
    this.logger.log('ALL CHANNELS COUNT:', Object.keys(this.channels.all).length)
    this.logger.log('ALL CHANNELS COUNT:', Object.keys(this.channels.all))
    Object.values(this.channels.all).forEach(async (channel: PublicChannel) => {
      channel = this.transformChannel(channel)
      await this.subscribeToChannel(channel)
    })
    this.logger.log('STORAGE: Finished createDbForChannels')
  }

  private async createDbForMessageThreads() {
    this.messageThreads = await this.orbitDb.keyvalue<IMessageThread>('msg-threads', {
      accessController: {
        write: ['*']
      }
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
    this.logger.log('ALL MESSAGE THREADS COUNT:', Object.keys(this.messageThreads.all).length)
  }

  async initAllChannels() {
    this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
      channels: this.channels.all as unknown as { [key: string]: PublicChannel }
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
    return db
      .iterator({ limit: -1 })
      .collect()
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
        this.logger.log(`Can't subscribe to channel ${channelData.id}`)
        return
      }
      repo = this.publicChannelsRepos.get(channelData.id)
    }

    if (repo && !repo.eventsAttached) {
      this.logger.log('Subscribing to channel ', channelData.id)

      db.events.on('write', async (_address, entry) => {
        this.logger.log(`Writing to public channel db ${channelData.id}`)
        const verified = await this.verifyMessage(entry.payload.value)

        this.emit(StorageEvents.LOAD_MESSAGES, {
          messages: [entry.payload.value],
          isVerified: verified
        })
      })

      db.events.on('replicate.progress', async (address, _hash, entry, progress, total) => {
        this.logger.log(`progress ${progress as string}/${total as string}. Address: ${address as string}`)
        const messages = this.transformMessages([entry.payload.value])

        const verified = await this.verifyMessage(messages[0])

        const message = messages[0]

        this.emit(StorageEvents.LOAD_MESSAGES, {
          messages: [message],
          isVerified: verified
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
            username: username
          }

          this.emit(StorageEvents.SEND_PUSH_NOTIFICATION, payload)
        }
      })
      db.events.on('replicated', async address => {
        this.logger.log('Replicated.', address)
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        this.emit(StorageEvents.SEND_MESSAGES_IDS, {
          ids,
          channelId: channelData.id,
          communityId: this.communityId
        })
      })
      db.events.on('ready', () => {
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        this.emit(StorageEvents.SEND_MESSAGES_IDS, {
          ids,
          channelId: channelData.id,
          communityId: this.communityId
        })
      })
      await db.load()
      repo.eventsAttached = true
    }

    this.logger.log(`Subscribed to channel ${channelData.id}`)
    this.emit(StorageEvents.SET_CHANNEL_SUBSCRIBED, {
      channelId: channelData.id
    })
  }

  public transformMessages(msgs: ChannelMessage[]) {
    console.log('---------------- TRANSFORMING MESSAGES ----------------------')
    const messages = msgs.map((msg) => {
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
      isVerified: true
    })
    this.emit(StorageEvents.CHECK_FOR_MISSING_FILES, this.communityId)
  }

  private async createChannel(data: PublicChannel): Promise<EventStore<ChannelMessage>> {
    console.log('creating channel')
    if (!validate.isChannel(data)) {
      this.logger.error('STORAGE: Invalid channel format')
      throw new Error('Create channel validation error')
    }
    this.logger.log(`Creating channel ${data.id}`)

    // @ts-ignore
    const channelId = data.id || data.address

    const db: EventStore<ChannelMessage> = await this.orbitDb.log<ChannelMessage>(
      `channels.${channelId}`,
      {
        accessController: {
          type: 'messagesaccess',
          write: ['*']
        }
      }
    )

    const channel = this.channels.get(channelId)
    if (channel === undefined) {
      await this.channels.put(channelId, {
        ...data
      })
      this.emit(StorageEvents.CREATED_CHANNEL, {
        channel: data
      })
    }

    this.publicChannelsRepos.set(channelId, { db, eventsAttached: false })
    this.logger.log(`Set ${channelId} to local channels`)
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await db.load({ fetchEntryTimeout: 2000, })
    this.logger.log(`Created channel ${channelId}`)
    return db
  }

  public async deleteChannel(payload: { channelId: string; ownerPeerId: string }) {
    console.log('deleting channel storage', payload)
    const { channelId, ownerPeerId } = payload
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 15000 })
    const channel = this.channels.get(channelId)
    const isOwner = ownerPeerId === this.peerId.toString()
    if (channel && isOwner) {
      await this.channels.del(channelId)
    }
    let repo = this.publicChannelsRepos.get(channelId)
    if (!repo) {
      const db = await this.orbitDb.log<ChannelMessage>(
        `channels.${channelId}`,
        {
          accessController: {
            type: 'messagesaccess',
            write: ['*']
          }
        }
      )
      repo = {
        db,
        eventsAttached: false
      }
    }
    await repo.db.load()
    const allEntries = this.getAllEventLogRawEntries(repo.db)
    await repo.db.close()
    await repo.db.drop()
    const hashes = allEntries.map((e) => CID.parse(e.hash))
    const files = allEntries.map((e) => {
      return e.payload.value.media
    }).filter(isDefined)
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
      this.logger.error(
        `Could not send message. No '${message.channelId}' channel in saved public channels`
      )
      return
    }
    try {
      await repo.db.add(message)
    } catch (e) {
      this.logger.error(`STORAGE: Could not append message (entry not allowed to write to the log). Details: ${e.message}`)
    }
  }

  private attachFileManagerEvents = () => {
    this.filesManager.on(IpfsFilesManagerEvents.UPDATE_DOWNLOAD_PROGRESS, (status) => {
      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, status)
    })
    this.filesManager.on(IpfsFilesManagerEvents.UPDATE_MESSAGE_MEDIA, (messageMedia) => {
      this.emit(StorageEvents.UPDATE_MESSAGE_MEDIA, messageMedia)
    })
    this.filesManager.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, (payload) => {
      this.emit(StorageEvents.REMOVE_DOWNLOAD_STATUS, payload)
    })
    this.filesManager.on(StorageEvents.UPLOADED_FILE, (payload) => {
      this.emit(StorageEvents.UPLOADED_FILE, payload)
    })
    this.filesManager.on(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, (payload) => {
      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, payload)
    })
    this.filesManager.on(StorageEvents.UPDATE_MESSAGE_MEDIA, (payload) => {
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
        write: ['*']
      }
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
        this.logger.log(`Can't subscribe to direct messages thread ${channelId}`)
        return
      }
      repo = this.directMessagesRepos.get(channelId)
    }

    if (repo && !repo.eventsAttached) {
      this.logger.log('Subscribing to direct messages thread ', channelId)
      this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
        messages: this.getAllEventLogEntries(db),
        channelId
      })
      db.events.on('write', (_address, _entry) => {
        this.logger.log('Writing')
        this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
          messages: this.getAllEventLogEntries(db),
          channelId
        })
      })
      db.events.on('replicated', () => {
        this.logger.log('Message replicated')
        this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
          messages: this.getAllEventLogEntries(db),
          channelId
        })
      })
      db.events.on('ready', () => {
        this.logger.log('DIRECT Messages thread ready')
      })
      repo.eventsAttached = true
      this.logger.log('Subscription to channel ready', channelId)
    }
  }

  private async createDirectMessageThread(channelId: string): Promise<EventStore<string>> {
    if (!channelId) {
      this.logger.log("No channel ID, can't create channel")
      throw new Error('No channel ID, can\'t create channel')
    }

    this.logger.log(`creatin direct message thread for ${channelId}`)

    const db: EventStore<string> = await this.orbitDb.log<string>(`dms.${channelId}`, {
      accessController: {
        write: ['*']
      }
    })
    db.events.on('replicated', () => {
      this.logger.log('replicated some messages')
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
    this.logger.log('STORAGE: sendDirectMessage entered')
    this.logger.log(`STORAGE: sendDirectMessage channelId is ${channelId}`)
    this.logger.log(`STORAGE: sendDirectMessage message is ${JSON.stringify(message)}`)
    const db = this.directMessagesRepos.get(channelId)?.db
    if (!db) return
    this.logger.log(`STORAGE: sendDirectMessage db is ${db.address.root}`)
    this.logger.log(`STORAGE: sendDirectMessage db is ${db.address.path}`)
    await db.add(message)
  }

  public async getPrivateConversations(): Promise<void> {
    this.logger.log('STORAGE: getPrivateConversations enetered')
    // @ts-expect-error - OrbitDB's type declaration of `load` arguments lacks 'options'
    await this.messageThreads.load({ fetchEntryTimeout: 2000 })
    const payload = this.messageThreads.all
    this.logger.log('STORAGE: getPrivateConversations payload payload')
    this.emit(StorageEvents.LOAD_ALL_PRIVATE_CONVERSATIONS, payload)
  }

  public async saveCertificate(payload: SaveCertificatePayload): Promise<boolean> {
    this.logger.log('About to save certificate...')
    if (!payload.certificate) {
      this.logger.log('Certificate is either null or undefined, not saving to db')
      return false
    }
    const verification = await verifyUserCert(
      payload.rootPermsData.certificate,
      payload.certificate
    )
    if (verification.resultCode !== 0) {
      this.logger.error('Certificate is not valid')
      this.logger.error(verification.resultMessage)
      return false
    }
    this.logger.log('Saving certificate...')
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
          this.logger.error(`Get user name from cert: Could not parse certificate for field type ${CertFieldsTypes.nickName}`)
          continue
        }
        this.userNamesMap.set(key, value)
      }
    }

    return this.userNamesMap.get(publicKey)
  }

  public async deleteFilesFromChannel(payload: DeleteFilesFromChannelSocketPayload) {
    const { messages } = payload
    Object.keys(messages).map(async(key) => {
      const message = messages[key]
      if (message?.media?.path) {
        const mediaPath = message.media.path
        this.logger.log('deleteFilesFromChannel : mediaPath', mediaPath)
        const isFileExist = await this.checkIfFileExist(mediaPath)
        this.logger.log(`deleteFilesFromChannel : isFileExist- ${isFileExist}`)
        if (isFileExist) {
            fs.unlink(mediaPath, unlinkError => {
              if (unlinkError) {
                this.logger.log(`deleteFilesFromChannel : unlink error - ${unlinkError}`)
              }
            })
        } else {
          this.logger.log(`deleteFilesFromChannel : file dont exist - ${mediaPath}`)
        }
      }
    })
  }

  public async checkIfFileExist(filepath: string): Promise<boolean> {
      return await new Promise((resolve) => {
        fs.access(filepath, fs.constants.F_OK, error => {
          resolve(!error)
        })
      })
  }

  private async deleteFilesFromTemporaryDir() {
    const temporaryFilesDirectory = path.join(this.quietDir, '/../', 'temporaryFiles')
    fs.readdir(temporaryFilesDirectory, (readDirErr, files) => {
      if (readDirErr) this.logger.log(`deleteFilesFromTemporaryDir : readdir error - ${readDirErr}`)
      for (const file of files) {
        fs.unlink(path.join(temporaryFilesDirectory, file), unlinkError => {
          if (unlinkError) this.logger.log(`deleteFilesFromTemporaryDir : unlink error - ${unlinkError}`)
        })
      }
    })
  }
}
