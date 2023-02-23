import {
  CertFieldsTypes,
  getCertFieldValue,
  keyFromCertificate,
  keyObjectFromString,
  parseCertificate,
  verifySignature,
  verifyUserCert
} from '@quiet/identity'
import {
  ChannelMessage,
  PublicChannel,
  SaveCertificatePayload,
  FileMetadata,
  DownloadStatus,
  DownloadProgress,
  DownloadState,
  imagesExtensions,
  User,
  PushNotificationPayload
} from '@quiet/state-manager'
import type { IPFS, create as createType } from 'ipfs-core'
import type { Libp2p } from 'libp2p'
import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import KeyValueStore from 'orbit-db-kvstore'
import path from 'path'
import { EventEmitter } from 'events'
import PeerId from 'peer-id'
import { CryptoEngine, getCrypto, setEngine } from 'pkijs'
import {
  IMessageThread,
  DirectMessagesRepo,
  PublicChannelsRepo,
  StorageOptions
} from '../common/types'
import { Config } from '../constants'
import AccessControllers from 'orbit-db-access-controllers'
import { MessagesAccessController } from './MessagesAccessController'
import logger from '../logger'
import validate from '../validation/validators'
import fs from 'fs'
import { promisify } from 'util'
import { stringToArrayBuffer } from 'pvutils'
import sizeOf from 'image-size'
import { StorageEvents } from './types'

import { create } from 'ipfs-core'
import { CID } from 'multiformats/cid'

const sizeOfPromisified = promisify(sizeOf)

const log = logger('db')

const { compare, createPaths, removeDirs, removeFiles, getUsersAddresses } = await import('../common/utils')
export class Storage extends EventEmitter {
  public quietDir: string
  public peerId: PeerId
  protected ipfs: IPFS
  protected orbitdb: OrbitDB
  private channels: KeyValueStore<PublicChannel>
  private messageThreads: KeyValueStore<IMessageThread>
  private certificates: EventStore<string>
  public publicChannelsRepos: Map<String, PublicChannelsRepo> = new Map()
  public directMessagesRepos: Map<String, DirectMessagesRepo> = new Map()
  public options: StorageOptions
  public orbitDbDir: string
  public ipfsRepoPath: string
  readonly downloadCancellations: string[]
  private readonly __communityId: string
  private readonly publicKeysMap: Map<string, CryptoKey>
  private readonly userNamesMap: Map<string, string>

  constructor(quietDir: string, communityId: string, options?: Partial<StorageOptions>) {
    super()
    this.quietDir = quietDir
    this.__communityId = communityId
    this.options = {
      ...new StorageOptions(),
      ...options
    }
    this.orbitDbDir = path.join(this.quietDir, this.options.orbitDbDir || Config.ORBIT_DB_DIR)
    this.ipfsRepoPath = path.join(this.quietDir, this.options.ipfsDir || Config.IPFS_REPO_PATH)
    this.downloadCancellations = []
    this.publicKeysMap = new Map()
    this.userNamesMap = new Map()
  }

  public async init(libp2p: Libp2p, peerID: PeerId): Promise<void> {
    log('Initializing storage')
    this.peerId = peerID
    removeFiles(this.quietDir, 'LOCK')
    removeDirs(this.quietDir, 'repo.lock')
    if (this.options?.createPaths) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }
    this.ipfs = await this.initIPFS(libp2p, peerID)

    AccessControllers.addAccessController({ AccessController: MessagesAccessController })

    this.orbitdb = await OrbitDB.createInstance(this.ipfs, {
      // @ts-ignore
      id: peerID.toString(),
      directory: this.orbitDbDir,
      // @ts-ignore
      AccessControllers: AccessControllers
    })
    log('Initialized storage')
  }

  public async initDatabases() {
    log('1/6')
    await this.createDbForChannels()
    log('2/6')
    await this.createDbForCertificates()
    log('3/6')
    await this.createDbForMessageThreads()
    log('4/6')
    await this.initAllChannels()
    log('5/6')
    await this.initAllConversations()
    log('6/6')
    log('Initialized DBs')
  }

  private async __stopOrbitDb() {
    if (this.orbitdb) {
      log('Stopping OrbitDB')
      try {
        await this.orbitdb.stop()
      } catch (err) {
        log.error(`Following error occured during closing orbitdb database: ${err as string}`)
      }
    }
  }

  private async __stopIPFS() {
    if (this.ipfs) {
      log('Stopping IPFS')
      try {
        await this.ipfs.stop()
      } catch (err) {
        log.error(`Following error occured during closing ipfs database: ${err as string}`)
      }
    }
  }

  public async stopOrbitDb() {
    await this.__stopOrbitDb()
    await this.__stopIPFS()
  }

  public get communityId() {
    return this.__communityId
  }

  protected async initIPFS(libp2p: any, peerID: any): Promise<IPFS> {
    log('Initializing IPFS')
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
    this.emit(StorageEvents.UPDATE_PEERS_LIST, { communityId: this.communityId, peerList: peers })
  }

  public async loadAllCertificates() {
    log('Getting all certificates')
    this.emit(StorageEvents.LOAD_CERTIFICATES, {
      certificates: this.getAllEventLogEntries(this.certificates)
    })
  }

  public async createDbForCertificates() {
    log('createDbForCertificates init')
    this.certificates = await this.orbitdb.log<string>('certificates', {
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

        this.userNamesMap.set(key, username)
      }
    )
    this.certificates.events.on('replicated', async () => {
      log('REPLICATED: Certificates')
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates)
      })
      await this.updatePeersList()
    })
    this.certificates.events.on('write', async (_address, entry) => {
      log('Saved certificate locally')
      log(entry.payload.value)
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates)
      })
      await this.updatePeersList()
    })
    this.certificates.events.on('ready', () => {
      log('Loaded certificates to memory')
      this.emit(StorageEvents.LOAD_CERTIFICATES, {
        certificates: this.getAllEventLogEntries(this.certificates)
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.certificates.load({ fetchEntryTimeout: 15000 })
    const allCertificates = this.getAllEventLogEntries(this.certificates)
    log('ALL Certificates COUNT:', allCertificates.length)
    log('STORAGE: Finished createDbForCertificates')
  }

  public async loadAllChannels() {
    log('Getting all channels')
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 2000 })
    this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
      channels: this.channels.all as unknown as { [key: string]: PublicChannel }
    })
  }

  private async createDbForChannels() {
    log('createDbForChannels init')
    this.channels = await this.orbitdb.keyvalue<PublicChannel>('public-channels', {
      accessController: {
        write: ['*']
      }
    })

    this.channels.events.on('write', async (_address, entry) => {
      log('WRITE: Channels')
    })

    this.channels.events.on('replicated', async () => {
      log('REPLICATED: Channels')
      // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
      await this.channels.load({ fetchEntryTimeout: 2000 })
      this.emit(StorageEvents.LOAD_PUBLIC_CHANNELS, {
        channels: this.channels.all as unknown as { [key: string]: PublicChannel }
      })

      Object.values(this.channels.all).forEach(async (channel: PublicChannel) => {
        await this.subscribeToChannel(channel)
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 15000 })
    log('ALL CHANNELS COUNT:', Object.keys(this.channels.all).length)
    log('ALL CHANNELS COUNT:', Object.keys(this.channels.all))
    Object.values(this.channels.all).forEach(async (channel: PublicChannel) => {
      await this.subscribeToChannel(channel)
    })
    log('STORAGE: Finished createDbForChannels')
  }

  private async createDbForMessageThreads() {
    this.messageThreads = await this.orbitdb.keyvalue<IMessageThread>('msg-threads', {
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
    log('ALL MESSAGE THREADS COUNT:', Object.keys(this.messageThreads.all).length)
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

  public async subscribeToChannel(channelData: PublicChannel): Promise<void> {
    let db: EventStore<ChannelMessage>
    let repo = this.publicChannelsRepos.get(channelData.address)
    if (repo) {
      db = repo.db
    } else {
      db = await this.createChannel(channelData)
      if (!db) {
        log(`Can't subscribe to channel ${channelData.address}`)
        return
      }
      repo = this.publicChannelsRepos.get(channelData.address)
    }

    if (repo && !repo.eventsAttached) {
      log('Subscribing to channel ', channelData.address)

      db.events.on('write', async (_address, entry) => {
        log(`Writing to public channel db ${channelData.address}`)
        const verified = await this.verifyMessage(entry.payload.value)

        this.emit(StorageEvents.LOAD_MESSAGES, {
          messages: [entry.payload.value],
          isVerified: verified
        })
      })

      db.events.on('replicate.progress', async (address, _hash, entry, progress, total) => {
        log(`progress ${progress as string}/${total as string}. Address: ${address as string}`)
        const message = entry.payload.value

        const verified = await this.verifyMessage(message)

        this.emit(StorageEvents.LOAD_MESSAGES, {
          messages: [entry.payload.value],
          isVerified: verified
        })

        // Display push notifications on mobile
        if (process.env.BACKEND === 'mobile') {
          if (!verified) return

          // Do not notify about old messages
          if (parseInt(message.createdAt) < parseInt(process.env.CONNECTION_TIME)) return

          const username = this.getUserNameFromCert(message.pubKey)

          const payload: PushNotificationPayload = {
            message: JSON.stringify(message),
            username: username
          }

          this.emit(StorageEvents.SEND_PUSH_NOTIFICATION, payload)
        }
      })
      db.events.on('replicated', async address => {
        log('Replicated.', address)
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        this.emit(StorageEvents.SEND_MESSAGES_IDS, {
          ids,
          channelAddress: channelData.address,
          communityId: this.communityId
        })
      })
      db.events.on('ready', () => {
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        this.emit(StorageEvents.SEND_MESSAGES_IDS, {
          ids,
          channelAddress: channelData.address,
          communityId: this.communityId
        })
      })
      await db.load()
      repo.eventsAttached = true
    }

    log(`Subscribed to channel ${channelData.address}`)
    this.emit(StorageEvents.SET_CHANNEL_SUBSCRIBED, {
      channelAddress: channelData.address
    })
  }

  public async askForMessages(channelAddress: string, ids: string[]) {
    const repo = this.publicChannelsRepos.get(channelAddress)
    if (!repo) return
    const messages = this.getAllEventLogEntries<ChannelMessage>(repo.db)
    const filteredMessages: ChannelMessage[] = []
    for (const id of ids) {
      filteredMessages.push(...messages.filter(i => i.id === id))
    }
    this.emit(StorageEvents.LOAD_MESSAGES, {
      messages: filteredMessages,
      isVerified: true
    })
    this.emit(StorageEvents.CHECK_FOR_MISSING_FILES, this.communityId)
  }

  private async createChannel(data: PublicChannel): Promise<EventStore<ChannelMessage>> {
    if (!validate.isChannel(data)) {
      log.error('STORAGE: Invalid channel format')
      return
    }
    log(`Creating channel ${data.address}`)

    const db: EventStore<ChannelMessage> = await this.orbitdb.log<ChannelMessage>(
      `channels.${data.address}`,
      {
        accessController: {
          type: 'messagesaccess',
          write: ['*']
        }
      }
    )

    const channel = this.channels.get(data.address)
    if (channel === undefined) {
      await this.channels.put(data.address, {
        ...data
      })
      this.emit(StorageEvents.CREATED_CHANNEL, {
        channel: data
      })
    }

    this.publicChannelsRepos.set(data.address, { db, eventsAttached: false })
    log(`Set ${data.address} to local channels`)
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await db.load({ fetchEntryTimeout: 2000 })
    log(`Created channel ${data.address}`)
    return db
  }

  public async sendMessage(message: ChannelMessage) {
    if (!validate.isMessage(message)) {
      log.error('STORAGE: public channel message is invalid')
      return
    }
    const repo = this.publicChannelsRepos.get(message.channelAddress)
    if (!repo) {
      log.error(
        `Could not send message. No '${message.channelAddress}' channel in saved public channels`
      )
      return
    }
    try {
      await repo.db.add(message)
    } catch (e) {
      log.error('STORAGE: Could not append message (entry not allowed to write to the log)')
    }
  }

  public copyFile(originalFilePath: string, filename: string): string {
    /**
     * Copy file to a different directory and return the new path
     */
    const uploadsDir = path.join(this.quietDir, 'uploads')
    const newPath = path.join(uploadsDir, filename)
    let filePath = originalFilePath
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      fs.copyFileSync(originalFilePath, newPath)
      filePath = newPath
    } catch (e) {
      log.error(`Couldn't copy file ${originalFilePath} to ${newPath}. Error: ${e.message}`)
    }
    return filePath
  }

  public async uploadFile(metadata: FileMetadata) {
    let width: number = null
    let height: number = null
    if (imagesExtensions.includes(metadata.ext)) {
      let imageSize = null
      try {
        imageSize = await sizeOfPromisified(metadata.path)
      } catch (e) {
        console.error(`Couldn't get image dimensions (${metadata.path}). Error: ${e.message}`)
        throw new Error(`Couldn't get image dimensions (${metadata.path}). Error: ${e.message}`)
      }
      width = imageSize.width
      height = imageSize.height
    }

    const stream = fs.createReadStream(metadata.path, { highWaterMark: 64 * 1024 * 10 })
    const uploadedFileStreamIterable = {
      async* [Symbol.asyncIterator]() {
        for await (const data of stream) {
          yield data
        }
      }
    }

    // Create directory for file
    const dirname = 'uploads'
    await this.ipfs.files.mkdir(`/${dirname}`, { parents: true })

    // Write file to IPFS
    const uuid = `${Date.now()}_${Math.random().toString(36).substr(2.9)}`
    const filename = `${uuid}_${metadata.name}${metadata.ext}`

    // Save copy to separate directory
    const filePath = this.copyFile(metadata.path, filename)
    console.time(`Writing ${filename} to ipfs`)
    await this.ipfs.files.write(`/${dirname}/${filename}`, uploadedFileStreamIterable, {
      create: true
    })
    console.timeEnd(`Writing ${filename} to ipfs`)

    // Get uploaded file information
    const entries = this.ipfs.files.ls(`/${dirname}`)
    for await (const entry of entries) {
      if (entry.name === filename) {
        this.emit(StorageEvents.REMOVE_DOWNLOAD_STATUS, { cid: metadata.cid })

        const fileMetadata: FileMetadata = {
          ...metadata,
          path: filePath,
          cid: entry.cid.toString(),
          size: entry.size,
          width,
          height
        }

        this.emit(StorageEvents.UPLOADED_FILE, fileMetadata)

        const statusReady: DownloadStatus = {
          mid: fileMetadata.message.id,
          cid: fileMetadata.cid,
          downloadState: DownloadState.Hosted,
          downloadProgress: undefined
        }

        this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, statusReady)

        if (metadata.path !== filePath) {
          log(`Updating file metadata (${metadata.path} => ${filePath})`)
          this.emit(StorageEvents.UPDATE_MESSAGE_MEDIA, fileMetadata)
        }
        break
      }
    }
  }

  public async downloadFile(metadata: FileMetadata) {
    type IPFSPath = typeof CID | string

    // @ts-ignore
    const _CID: IPFSPath = CID.parse(metadata.cid)

    // Compare actual and reported file size
    // @ts-ignore
    const stat = await this.ipfs.files.stat(_CID)
    if (!compare(metadata.size, stat.size, 0.05)) {
      const maliciousStatus: DownloadStatus = {
        mid: metadata.message.id,
        cid: metadata.cid,
        downloadState: DownloadState.Malicious,
        downloadProgress: undefined
      }

      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, maliciousStatus)

      return
    }

    // @ts-ignore
    const entries = this.ipfs.cat(_CID)

    const downloadDirectory = path.join(this.quietDir, 'downloads', metadata.cid)
    createPaths([downloadDirectory])

    const fileName = metadata.name + metadata.ext
    const filePath = `${path.join(downloadDirectory, fileName)}`

    const writeStream = fs.createWriteStream(filePath)

    let downloadedBytes = 0
    let stopwatch = 0

    let downloadState: DownloadState = DownloadState.Ready

    for await (const entry of entries) {
      // Check if download is not meant to be canceled
      if (this.downloadCancellations.includes(metadata.message.id)) {
        downloadState = DownloadState.Canceled
        log(`Cancelled downloading ${metadata.path}`)
        break
      }
      await new Promise<void>((resolve, reject) => {
        writeStream.write(entry, err => {
          if (err) {
            log.error(`${metadata.name} download error: ${err}`)
            reject(err)
          }

          let transferSpeed = -1

          if (stopwatch === 0) {
            stopwatch = Date.now()
          } else {
            const timestamp = Date.now()
            let delay = 0.0001 // Workaround for avoiding delay 0:
            delay += (timestamp - stopwatch) / 1000 // in seconds
            transferSpeed = entry.byteLength / delay

            // Prevent passing null value
            if (transferSpeed === null) {
              transferSpeed = 0
            }

            stopwatch = timestamp
          }

          downloadedBytes += entry.byteLength

          const downloadProgress: DownloadProgress = {
            size: metadata.size,
            downloaded: downloadedBytes,
            transferSpeed: transferSpeed
          }

          const downloadStatus: DownloadStatus = {
            mid: metadata.message.id,
            cid: metadata.cid,
            downloadState: DownloadState.Downloading,
            downloadProgress: downloadProgress
          }

          const percentage = Math.floor((downloadProgress.downloaded / downloadProgress.size) * 100)

          log(
            `${new Date().toUTCString()}, ${metadata.name} downloaded bytes ${percentage}% ${downloadProgress.downloaded
            } / ${downloadProgress.size}`
          )
          this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, downloadStatus)

          resolve()
        })
      })
    }

    writeStream.end()

    if (downloadState === DownloadState.Canceled) {
      const downloadCanceled: DownloadProgress = {
        size: metadata.size,
        downloaded: 0,
        transferSpeed: 0
      }

      const statusCanceled: DownloadStatus = {
        mid: metadata.message.id,
        cid: metadata.cid,
        downloadState: DownloadState.Canceled,
        downloadProgress: downloadCanceled
      }

      // Canceled Download
      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, statusCanceled)
    } else {
      const downloadCompleted: DownloadProgress = {
        size: metadata.size,
        downloaded: metadata.size,
        transferSpeed: 0
      }

      const statusCompleted: DownloadStatus = {
        mid: metadata.message.id,
        cid: metadata.cid,
        downloadState: DownloadState.Completed,
        downloadProgress: downloadCompleted
      }

      // Downloaded file
      this.emit(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, statusCompleted)

      const fileMetadata: FileMetadata = {
        ...metadata,
        path: filePath
      }
      this.emit(StorageEvents.UPDATE_MESSAGE_MEDIA, fileMetadata)
    }

    // Clear cancellation signal (if present)
    const index = this.downloadCancellations.indexOf(metadata.message.id)
    if (index > -1) {
      this.downloadCancellations.splice(index, 1)
    }
  }

  public cancelDownload(mid: string) {
    this.downloadCancellations.push(mid)
  }

  public async initializeConversation(address: string, encryptedPhrase: string): Promise<void> {
    if (!validate.isConversation(address, encryptedPhrase)) {
      log.error('STORAGE: Invalid conversation format')
      return
    }
    const db: EventStore<string> = await this.orbitdb.log<string>(`dms.${address}`, {
      accessController: {
        write: ['*']
      }
    })

    this.directMessagesRepos.set(address, { db, eventsAttached: false })
    await this.messageThreads.put(address, encryptedPhrase)
    await this.subscribeToDirectMessageThread(address)
  }

  public async subscribeToAllConversations(conversations) {
    await Promise.all(
      conversations.map(async channel => {
        await this.subscribeToDirectMessageThread(channel)
      })
    )
  }

  public async subscribeToDirectMessageThread(channelAddress: string) {
    let db: EventStore<string>
    let repo = this.directMessagesRepos.get(channelAddress)

    if (repo) {
      db = repo.db
    } else {
      db = await this.createDirectMessageThread(channelAddress)
      if (!db) {
        log(`Can't subscribe to direct messages thread ${channelAddress}`)
        return
      }
      repo = this.directMessagesRepos.get(channelAddress)
    }

    if (repo && !repo.eventsAttached) {
      log('Subscribing to direct messages thread ', channelAddress)
      this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
        messages: this.getAllEventLogEntries(db),
        channelAddress
      })
      db.events.on('write', (_address, _entry) => {
        log('Writing')
        this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
          messages: this.getAllEventLogEntries(db),
          channelAddress
        })
      })
      db.events.on('replicated', () => {
        log('Message replicated')
        this.emit(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, {
          messages: this.getAllEventLogEntries(db),
          channelAddress
        })
      })
      db.events.on('ready', () => {
        log('DIRECT Messages thread ready')
      })
      repo.eventsAttached = true
      log('Subscription to channel ready', channelAddress)
    }
  }

  private async createDirectMessageThread(channelAddress: string): Promise<EventStore<string>> {
    if (!channelAddress) {
      log("No channel address, can't create channel")
      return
    }

    log(`creatin direct message thread for ${channelAddress}`)

    const db: EventStore<string> = await this.orbitdb.log<string>(`dms.${channelAddress}`, {
      accessController: {
        write: ['*']
      }
    })
    db.events.on('replicated', () => {
      log('replicated some messages')
    })
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await db.load({ fetchEntryTimeout: 2000 })

    this.directMessagesRepos.set(channelAddress, { db, eventsAttached: false })
    return db
  }

  public async sendDirectMessage(channelAddress: string, message: string) {
    if (!validate.isDirectMessage(message)) {
      log.error('STORAGE: Invalid direct message format')
      return
    }
    await this.subscribeToDirectMessageThread(channelAddress) // Is it necessary? Yes it is atm
    log('STORAGE: sendDirectMessage entered')
    log(`STORAGE: sendDirectMessage channelAddress is ${channelAddress}`)
    log(`STORAGE: sendDirectMessage message is ${JSON.stringify(message)}`)
    const db = this.directMessagesRepos.get(channelAddress).db
    log(`STORAGE: sendDirectMessage db is ${db.address.root}`)
    log(`STORAGE: sendDirectMessage db is ${db.address.path}`)
    await db.add(message)
  }

  public async getPrivateConversations(): Promise<void> {
    log('STORAGE: getPrivateConversations enetered')
    // @ts-expect-error - OrbitDB's type declaration of `load` arguments lacks 'options'
    await this.messageThreads.load({ fetchEntryTimeout: 2000 })
    const payload = this.messageThreads.all
    log('STORAGE: getPrivateConversations payload payload')
    this.emit(StorageEvents.LOAD_ALL_PRIVATE_CONVERSATIONS, payload)
  }

  public async saveCertificate(payload: SaveCertificatePayload): Promise<boolean> {
    log('About to save certificate...')
    if (!payload.certificate) {
      log('Certificate is either null or undefined, not saving to db')
      return false
    }
    const verification = await verifyUserCert(
      payload.rootPermsData.certificate,
      payload.certificate
    )
    if (verification.resultCode !== 0) {
      log.error('Certificate is not valid')
      log.error(verification.resultMessage)
      return false
    }
    log('Saving certificate...')
    await this.certificates.add(payload.certificate)
    return true
  }

  public getAllUsers(): User[] {
    const certs = this.getAllEventLogEntries(this.certificates)
    const allUsers = []
    for (const cert of certs) {
      const parsedCert = parseCertificate(cert)
      const onionAddress = getCertFieldValue(parsedCert, CertFieldsTypes.commonName)
      const peerId = getCertFieldValue(parsedCert, CertFieldsTypes.peerId)
      const username = getCertFieldValue(parsedCert, CertFieldsTypes.nickName)
      const dmPublicKey = getCertFieldValue(parsedCert, CertFieldsTypes.dmPublicKey)
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
      if (certUsername.localeCompare(username, undefined, { sensitivity: 'base' }) === 0) {
        return cert
      }
    }
    return null
  }

  public getUserNameFromCert(publicKey: string): string {
    if (!this.userNamesMap.get(publicKey)) {
      const certificates = this.getAllEventLogEntries(this.certificates)

      for (const cert of certificates) {
        const parsedCertificate = parseCertificate(cert)
        const key = keyFromCertificate(parsedCertificate)

        const value = getCertFieldValue(parsedCertificate, CertFieldsTypes.nickName)
        this.userNamesMap.set(key, value)
      }
    }

    return this.userNamesMap.get(publicKey)
  }
}
