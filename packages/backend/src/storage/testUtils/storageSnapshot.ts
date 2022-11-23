import fs from 'fs'
import Log from 'ipfs-log'
// import { CID } from 'multiformats/cid'
import {Libp2p} from 'libp2p'
import OrbitDB from 'orbit-db'
import EventStore from 'orbit-db-eventstore'
import PeerId from 'peer-id'
import { StorageOptions } from '../../common/types'
import { createPaths } from '../../common/utils'
import logger from '../../logger'
import { Storage } from '..'

const log = logger('dbSnap')

class StorageTestSnapshotOptions extends StorageOptions {
  messagesCount: number
  createSnapshot?: boolean = false
  useSnapshot?: boolean = false
}

interface SnapshotInfo {
  queuePath: string
  snapshotPath: string
  mode: number
  hash: string
  size: number
  unfinished: any[]
}

export class StorageTestSnapshot extends Storage {
  public messages: EventStore<string>
  public replicationStartTime: Date
  public messagesCount: number
  public snapshotInfoDb: EventStore<SnapshotInfo>
  public useSnapshot: boolean
  public name: string
  public replicationTime: number
  public declare options: StorageTestSnapshotOptions
  protected snapshotSaved: boolean
  protected msgReplCount: number

  constructor(
    quietDir: string,
    communityId: string,
    options?: Partial<StorageTestSnapshotOptions>
  ) {
    super(quietDir, communityId, options)
    this.options = {
      ...new StorageTestSnapshotOptions(),
      ...options
    }
    this.useSnapshot = options.useSnapshot || process.env.USE_SNAPSHOT === 'true' // Actually use snapshot mechanizm
    this.messagesCount = options.messagesCount // Quantity of messages that will be added to db
    this.msgReplCount = 0
    this.snapshotSaved = false
    this.name = (Math.random() + 1).toString(36).substring(7)
  }

  public async init(libp2p: Libp2p, peerID: PeerId): Promise<void> {
    log(`${this.name}; StorageTest: Entered init`)
    if (this.options?.createPaths) {
      createPaths([this.ipfsRepoPath, this.orbitDbDir])
    }
    this.ipfs = await this.initIPFS(libp2p, peerID)

    this.orbitdb = await OrbitDB.createInstance(this.ipfs, { directory: this.orbitDbDir })

    await this.createDbForSnapshotInfo()
    await this.createDbForMessages()
    log(`Initialized '${this.name}'`)
  }

  public setName(name) {
    this.name = name
  }

  private async createDbForSnapshotInfo() {
    if (!this.useSnapshot) {
      return
    }
    this.snapshotInfoDb = await this.orbitdb.log<SnapshotInfo>('092183012', {
      accessController: {
        write: ['*']
      }
    })

    // eslint-disable-next-line
    this.snapshotInfoDb.events.on('replicated', async () => {
      // Retrieve snapshot that someone else saved to db
      if (!this.options.createSnapshot || process.env.CREATE_SNAPSHOT !== 'true') {
        log('Replicated snapshotInfoDb')
        await this.saveRemoteSnapshot(this.messages)
        console.time('load from snapshot')
        await this.loadFromSnapshot(this.messages)
        console.timeEnd('load from snapshot')
      }
    })
    // this.snapshotInfoDb.events.on('replicate.progress', (address, hash, entry, progress, total) => {
    // log(`${this.name}; replication in progress:`, address, hash, entry, progress, total)
    // log('>>', entry.payload.value.snapshot)
    // })
  }

  private async createDbForMessages() {
    log('createDbForMessages init')
    this.messages = await this.orbitdb.log<string>('3479623913-test', {
      accessController: {
        write: ['*']
      }
    })

    // Create snapshot and save to db for other peers to retrieve
    if (this.options.createSnapshot || process.env.CREATE_SNAPSHOT === 'true') {
      console.time(`${this.name}; Adding messages`)
      await this.addMessages()
      console.timeEnd(`${this.name}; Adding messages`)
      console.time('Loading messages')
      await this.messages.load()
      console.timeEnd('Loading messages')
      if (this.useSnapshot) {
        console.time('Saving Snapshot')
        await this.saveSnapshot(this.messages)
        console.timeEnd('Saving Snapshot')
      }
    }

    // eslint-disable-next-line
    this.messages.events.on('replicated', async () => {
      this.msgReplCount += 1
      log(`${this.name}; Replicated ${this.msgReplCount} chunk`)
      // await this.messages.load()
      // log('Loaded entries after replication:', this.getAllEventLogEntries(this.messages).length)
    })

    // eslint-disable-next-line
    this.messages.events.on(
      'replicate.progress',
      async (_address, _hash, _entry, progress, _total) => {
        if (!this.replicationStartTime) {
          console.time(`${this.name}; Replication time`)
          this.replicationStartTime = new Date()
          log('progress start', progress)
        }
        // log('---')
        // log(`replicate.progress: ${address}`)
        // log(`replicate.progress: ${hash}`)
        // log(`${this.name}; replicate.progress: ${entry.payload.value}`)
        // log(`replicate.progress: ${progress}`)
        // log(`replicate.progress: ${total}`)
        // await this.messages.load()
        // log('Loaded entries replicate.progress:', this.getAllEventLogEntries(this.messages).length)
        // fs.writeFileSync('allReplicatedMessages.json', JSON.stringify(this.getAllEventLogEntries(this.messages)))
        if (progress === this.messagesCount) {
          console.timeEnd(`${this.name}; Replication time`)
          const diff = new Date().getTime() - this.replicationStartTime.getTime()
          this.replicationTime = Number(diff / 1000)
        }
      }
    )

    await this.messages.load()
    log(`${this.name}; Loaded entries:`, this.getAllEventLogEntries(this.messages).length)
  }

  private async addMessages() {
    // Generate and add "messages" to db
    log(`Adding ${this.messagesCount} messages`)
    const range = n => Array.from(Array(n).keys())
    const messages = range(this.messagesCount).map(nr => `message_${nr.toString()}`)
    await Promise.all(messages.map(async msg => await this.messages.add(msg)))

    // Use code below if you care about messages order
    // for (const nr of range(this.messagesCount)) {
    //   // console.time(`adding msg ${nr.toString()}`)
    //   await this.messages.add(`message_${nr.toString()}`)
    //   // console.timeEnd(`adding msg ${nr.toString()}`)
    // }
  }

  public async addMessage(msg: string) {
    await this.messages.add(msg)
  }

  public getMessagesCount(): number {
    return this.getAllEventLogEntries(this.messages).length
  }

  public async saveRemoteSnapshot(db) {
    // Save retrieved snapshot info to local cache
    if (this.snapshotSaved) {
      return
    }
    log('Saving remote snapshot locally')
    const snapshotData = this.getSnapshotFromDb()

    await db._cache.set(snapshotData.snapshotPath, snapshotData.snapshot)
    await db._cache.set(snapshotData.queuePath, snapshotData.unfinished)
    this.snapshotSaved = true
  }

  async saveSnapshotInfoToDb(queuePath, snapshotPath, snapshot, unfinished) {
    log('Saving snapshot info to DB')
    await this.snapshotInfoDb.add({
      queuePath,
      snapshotPath,
      mode: snapshot.mode,
      hash: snapshot.hash,
      size: snapshot.size,
      unfinished
    })
    log('Saved snapshot info to DB')
  }

  public getSnapshotFromDb() {
    const snapshotInfo: SnapshotInfo = this.getAllEventLogEntries(this.snapshotInfoDb)[0] // Assume that at this point we replicated snapshot info
    log(`${this.name}; snapshot retrieved`, snapshotInfo)
    const cidObj = null
    log('CID', cidObj)
    const snapshot = {
      path: snapshotInfo.hash,
      cid: cidObj,
      size: snapshotInfo.size,
      mode: snapshotInfo.mode,
      mtime: undefined,
      hash: snapshotInfo.hash
    }
    return {
      queuePath: snapshotInfo.queuePath,
      snapshotPath: snapshotInfo.snapshotPath,
      snapshot,
      unfinished: snapshotInfo.unfinished
    }
  }

  async saveSnapshot(db) {
    // Copied from orbit-db-store
    const unfinished = db._replicator.getQueue()

    const snapshotData = db._oplog.toSnapshot()
    const buf = Buffer.from(
      JSON.stringify({
        id: snapshotData.id,
        heads: snapshotData.heads,
        size: snapshotData.values.length,
        values: snapshotData.values,
        type: db.type
      })
    )

    const snapshot = await db._ipfs.add(buf)

    snapshot.hash = snapshot.cid.toString() // js-ipfs >= 0.41, ipfs.add results contain a cid property (a CID instance) instead of a string hash property
    await db._cache.set(db.snapshotPath, snapshot)
    await db._cache.set(db.queuePath, unfinished)

    console.debug(
      `Saved snapshot: ${snapshot.hash as string}, queue length: ${unfinished.length as string}`
    )
    await this.saveSnapshotInfoToDb(
      // Saving it to share with others
      db.queuePath,
      db.snapshotPath,
      snapshot,
      unfinished
    )
    return [snapshot]
  }

  public saveSnapshotToFile() {
    // @ts-expect-error
    const snapshot = JSON.stringify(this.messages._oplog.toSnapshot())
    fs.writeFileSync(`snapshot_${this.name}_${new Date().toISOString()}.json`, snapshot)
  }

  async loadFromSnapshot(db) {
    // Copied from orbit-db-store
    if (db.options.onLoad) {
      await db.options.onLoad(db)
    }

    db.events.emit('load', db.address.toString()) // TODO emits inconsistent params, missing heads param

    const maxClock = (res, val) => Math.max(res, val.clock.time)

    const queue = await db._cache.get(db.queuePath)
    db.sync(queue || [])

    const snapshot = await db._cache.get(db.snapshotPath)

    if (snapshot) {
      const chunks = []
      for await (const chunk of db._ipfs.cat(snapshot.hash)) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      const snapshotData = JSON.parse(buffer.toString())
      // fs.writeFileSync(`loadedSnapshotData${new Date().toISOString()}.json`, buffer.toString()) // Saving snapshot to investigate it later

      const onProgress = (hash, entry, count, _total) => {
        db._recalculateReplicationStatus(count, entry.clock.time)
        db._onLoadProgress(hash, entry)
      }

      // Fetch the entries
      // Timeout 1 sec to only load entries that are already fetched (in order to not get stuck at loading)
      db._recalculateReplicationMax(snapshotData.values.reduce(maxClock, 0))
      if (snapshotData) {
        const log = await Log.fromJSON(db._ipfs, db.identity, snapshotData, {
          access: db.access,
          sortFn: db.options.sortFn,
          length: -1,
          timeout: 1000,
          onProgressCallback: onProgress
        })
        await db._oplog.join(log)
        await db._updateIndex()
        db.events.emit('replicated', db.address.toString()) // TODO: inconsistent params, count param not emited
      }
      db.events.emit('ready', db.address.toString(), db._oplog.heads)
    } else {
      throw new Error(`Snapshot for ${db.address as string} not found!`)
    }

    return db
  }
}
