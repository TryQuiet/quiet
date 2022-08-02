import { Crypto } from '@peculiar/webcrypto'
import {
  CertFieldsTypes,
  getCertFieldValue,
  parseCertificate,
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
  imagesExtensions
} from '@quiet/state-manager'
import * as IPFS from 'ipfs-core'
import Libp2p from 'libp2p'
import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import KeyValueStore from 'orbit-db-kvstore'
import path from 'path'
import PeerId from 'peer-id'
import { CryptoEngine, setEngine } from 'pkijs'
import {
  IMessageThread,
  DirectMessagesRepo,
  PublicChannelsRepo,
  StorageOptions
} from '../common/types'
import { compare, createPaths, removeDirs, removeFiles } from '../common/utils'
import { Config } from '../constants'
import AccessControllers from 'orbit-db-access-controllers'
import { MessagesAccessController } from './MessagesAccessController'
import logger from '../logger'
import IOProxy from '../socket/IOProxy'
import validate from '../validation/validators'
import { CID } from 'multiformats/cid'
import fs from 'fs'
import { promisify } from 'util'

import sizeOf from 'image-size'
const sizeOfPromisified = promisify(sizeOf)

const log = logger('db')

const webcrypto = new Crypto()
setEngine(
  'newEngine',
  // @ts-ignore
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle
  })
)

export class Storage {
  public quietDir: string
  public io: IOProxy
  public peerId: PeerId
  protected ipfs: IPFS.IPFS
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
  private readonly communityId: string

  constructor(
    quietDir: string,
    ioProxy: IOProxy,
    communityId: string,
    options?: Partial<StorageOptions>
  ) {
    this.quietDir = quietDir
    this.io = ioProxy
    this.communityId = communityId
    this.options = {
      ...new StorageOptions(),
      ...options
    }
    this.orbitDbDir = path.join(this.quietDir, this.options.orbitDbDir || Config.ORBIT_DB_DIR)
    this.ipfsRepoPath = path.join(this.quietDir, this.options.ipfsDir || Config.IPFS_REPO_PATH)
    this.downloadCancellations = []
  }

  public async init(libp2p: Libp2p, peerID: PeerId): Promise<void> {
    log('STORAGE: Entered init')
    removeFiles(this.quietDir, 'LOCK')
    removeDirs(this.quietDir, 'repo.lock')
    if (this.options?.createPaths) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }
    this.ipfs = await this.initIPFS(libp2p, peerID)

    AccessControllers.addAccessController({ AccessController: MessagesAccessController })

    this.orbitdb = await OrbitDB.createInstance(this.ipfs, {
      directory: this.orbitDbDir,
      // @ts-expect-error
      AccessControllers: AccessControllers
    })
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

  protected async initIPFS(libp2p: Libp2p, peerID: PeerId): Promise<IPFS.IPFS> {
    log('Initializing IPFS')
    // @ts-expect-error
    return await IPFS.create({
      // error here 'permission denied 0.0.0.0:443'
      libp2p: async () => libp2p,
      preload: { enabled: false },
      repo: this.ipfsRepoPath,
      EXPERIMENTAL: {
        ipnsPubsub: true
      },
      init: {
        privateKey: peerID.toJSON().privKey
      }
    })
  }

  public async createDbForCertificates() {
    log('createDbForCertificates init')
    this.certificates = await this.orbitdb.log<string>('certificates', {
      accessController: {
        write: ['*']
      }
    })

    this.certificates.events.on('replicated', () => {
      log('REPLICATED: Certificates')
      this.io.loadCertificates({ certificates: this.getAllEventLogEntries(this.certificates) })
    })
    this.certificates.events.on('write', (_address, entry) => {
      log('Saved certificate locally')
      log(entry.payload.value)
      this.io.loadCertificates({ certificates: this.getAllEventLogEntries(this.certificates) })
    })
    this.certificates.events.on('ready', () => {
      log('Loaded certificates to memory')
      this.io.loadCertificates({ certificates: this.getAllEventLogEntries(this.certificates) })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.certificates.load({ fetchEntryTimeout: 15000 })
    const allCertificates = this.getAllEventLogEntries(this.certificates)
    log('ALL Certificates COUNT:', allCertificates.length)
    log('STORAGE: Finished createDbForCertificates')
  }

  private async createDbForChannels() {
    log('createDbForChannels init')
    this.channels = await this.orbitdb.keyvalue<PublicChannel>('public-channels', {
      accessController: {
        write: ['*']
      }
    })

    this.channels.events.on('replicated', async () => {
      log('REPLICATED: Channels')
      // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
      await this.channels.load({ fetchEntryTimeout: 2000 })
      this.io.loadPublicChannels({
        channels: this.channels.all as unknown as { [key: string]: PublicChannel }
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.channels.load({ fetchEntryTimeout: 15000 })
    log('ALL CHANNELS COUNT:', Object.keys(this.channels.all).length)
    log('ALL CHANNELS COUNT:', Object.keys(this.channels.all))
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
        this.io.loadAllPrivateConversations(payload)
        await this.initAllConversations()
      }
    )
    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.messageThreads.load({ fetchEntryTimeout: 2000 })
    log('ALL MESSAGE THREADS COUNT:', Object.keys(this.messageThreads.all).length)
  }

  async initAllChannels() {
    this.io.loadPublicChannels({
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

      db.events.on('write', (_address, entry) => {
        log(`Writing to public channel db ${channelData.address}`)
        this.io.loadMessages({
          messages: [entry.payload.value]
        })
      })

      db.events.on('replicate.progress', (address, _hash, entry, progress, total) => {
        log(`progress ${progress as string}/${total as string}. Address: ${address as string}`)
        this.io.loadMessages({
          messages: [entry.payload.value]
        })
      })
      db.events.on('replicated', async address => {
        log('Replicated.', address)
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        this.io.sendMessagesIds({
          ids,
          channelAddress: channelData.address,
          communityId: this.communityId
        })
      })
      db.events.on('ready', () => {
        const ids = this.getAllEventLogEntries<ChannelMessage>(db).map(msg => msg.id)
        this.io.sendMessagesIds({
          ids,
          channelAddress: channelData.address,
          communityId: this.communityId
        })
      })
      await db.load()
      repo.eventsAttached = true
    }

    log(`Subscribed to channel ${channelData.address}`)
    this.io.setChannelSubscribed({
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
    this.io.loadMessages({
      messages: filteredMessages
    })
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
      this.io.createdChannel({
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
    await this.ipfs.files.write(`/${dirname}/${filename}`, uploadedFileStreamIterable, { create: true })
    console.timeEnd(`Writing ${filename} to ipfs`)

    // Get uploaded file information
    const entries = this.ipfs.files.ls(`/${dirname}`)
    for await (const entry of entries) {
      if (entry.name === filename) {
        this.io.removeDownloadStatus({ cid: metadata.cid })

        const fileMetadata: FileMetadata = {
          ...metadata,
          path: filePath,
          cid: entry.cid.toString(),
          size: entry.size,
          width,
          height
        }

        this.io.uploadedFile(fileMetadata)

        const statusReady: DownloadStatus = {
          mid: fileMetadata.message.id,
          cid: fileMetadata.cid,
          downloadState: DownloadState.Hosted,
          downloadProgress: undefined
        }

        this.io.updateDownloadProgress(statusReady)
        if (metadata.path !== filePath) {
          log(`Updating file metadata (${metadata.path} => ${filePath})`)
          this.io.updateMessageMedia(fileMetadata)
        }
        break
      }
    }
  }

  public async downloadFile(metadata: FileMetadata) {
    const _CID = CID.parse(metadata.cid)

    // Compare actual and reported file size
    const stat = await this.ipfs.files.stat(_CID)
    if (!compare(metadata.size, stat.size, 0.05)) {
      const maliciousStatus: DownloadStatus = {
        mid: metadata.message.id,
        cid: metadata.cid,
        downloadState: DownloadState.Malicious,
        downloadProgress: undefined
      }

      this.io.updateDownloadProgress(maliciousStatus)

      return
    }

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
        break
      }
      await new Promise<void>((resolve, reject) => {
        writeStream.write(entry, err => {
          if (err) reject(err)

          let transferSpeed = -1

          if (stopwatch === 0) {
            stopwatch = Date.now()
          } else {
            const timestamp = Date.now()
            const delay = (timestamp - stopwatch) / 1000 // in seconds

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

          this.io.updateDownloadProgress(downloadStatus)

          resolve()
        })
      })
    }

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
      this.io.updateDownloadProgress(statusCanceled)
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
      this.io.updateDownloadProgress(statusCompleted)

      const fileMetadata: FileMetadata = {
        ...metadata,
        path: filePath
      }

      this.io.updateMessageMedia(fileMetadata)
    }

    // Clear cancellation signal (if present)
    const index = this.downloadCancellations.indexOf(metadata.message.id)
    if (index > -1) {
      this.downloadCancellations.splice(index, 1)
    }

    writeStream.end()
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
      this.io.loadAllDirectMessages(this.getAllEventLogEntries(db), channelAddress)
      db.events.on('write', (_address, _entry) => {
        log('Writing')
        this.io.loadAllDirectMessages(this.getAllEventLogEntries(db), channelAddress)
      })
      db.events.on('replicated', () => {
        log('Message replicated')
        this.io.loadAllDirectMessages(this.getAllEventLogEntries(db), channelAddress)
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
    this.io.loadAllPrivateConversations(payload)
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

  public getAllUsers() {
    const certs = this.getAllEventLogEntries(this.certificates)
    const allUsers = []
    for (const cert of certs) {
      const parsedCert = parseCertificate(cert)
      const onionAddress = getCertFieldValue(parsedCert, CertFieldsTypes.commonName)
      const peerId = getCertFieldValue(parsedCert, CertFieldsTypes.peerId)
      allUsers.push({ onionAddress, peerId })
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
}
