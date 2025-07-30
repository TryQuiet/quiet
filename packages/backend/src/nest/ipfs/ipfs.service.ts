import { Inject, Injectable } from '@nestjs/common'
import { createHelia, HeliaLibp2p, type Helia } from 'helia'
import { bitswap } from '@helia/block-brokers'
import { IPFS_REPO_PATCH } from '../const'
import { createLogger } from '../common/logger'
import { LevelDatastore } from 'datastore-level'
import { LevelBlockstore, LevelBlockstoreInit } from 'blockstore-level'
import { Libp2pService } from '../libp2p/libp2p.service'
import { DatabaseOptions, Level } from 'level'
import { BITSWAP_PROTOCOL } from '../libp2p/libp2p.const'
import * as fs from 'fs'
import util from 'util'

type StoreInit = {
  blockstore?: Omit<LevelBlockstoreInit, 'valueEncoding' | 'keyEncoding'>
  datastore?: Omit<DatabaseOptions<string, Uint8Array>, 'valueEncoding' | 'keyEncoding'>
}

type Blockstore = {
  store: LevelBlockstore
  db: Level<string, Uint8Array>
}

type Datastore = {
  store: LevelDatastore
  db: Level<string, Uint8Array>
}

@Injectable()
export class IpfsService {
  public ipfsInstance: HeliaLibp2p | null
  private blockstore: Blockstore | null
  private datastore: Datastore | null

  private started: boolean
  private readonly logger = createLogger(IpfsService.name)

  // --- lifecycle & debug helpers ---
  private lifecycleBusy = false

  private async withLifecycleLock<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    while (this.lifecycleBusy) {
      this.logger.info(`[LOCK:${label}] waiting for lifecycle lock...`)
      await new Promise(r => setTimeout(r, 25))
    }
    this.lifecycleBusy = true
    this.logger.info(`[LOCK:${label}] acquired in ${Date.now() - start}ms`)
    try {
      return await fn()
    } finally {
      this.lifecycleBusy = false
      this.logger.info(`[LOCK:${label}] released`)
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private snapshot(label: string) {
    const repo = this.ipfsRepoPath
    const blocks = repo + '/blocks'
    const data = repo + '/data'
    const ls = (p: string) => {
      try {
        return fs.existsSync(p) ? fs.readdirSync(p) : '<missing>'
      } catch {
        return '<error>'
      }
    }
    const mode = (p: string) => {
      try {
        return fs.existsSync(p) ? fs.statSync(p).mode.toString(8) : '<missing>'
      } catch {
        return '<error>'
      }
    }
    this.logger.info(`[SNAPSHOT:${label}] repo=${repo} exists=${fs.existsSync(repo)} mode=${mode(repo)}`)
    const blocksList = ls(blocks)
    const dataList = ls(data)
    this.logger.info(
      `[SNAPSHOT:${label}] blocks=${blocks} exists=${fs.existsSync(blocks)} mode=${mode(blocks)} files=${Array.isArray(blocksList) ? (blocksList as string[]).slice(0, 20) : blocksList}`
    )
    this.logger.info(
      `[SNAPSHOT:${label}] data=${data} exists=${fs.existsSync(data)} mode=${mode(data)} files=${Array.isArray(dataList) ? (dataList as string[]).slice(0, 20) : dataList}`
    )
    this.logger.info(
      `[SNAPSHOT:${label}] blockDB.status=${this.blockstore?.db.status} blockStore.status=${(this.blockstore as any)?.store?.status ?? '<n/a>'}`
    )
    this.logger.info(
      `[SNAPSHOT:${label}] dataDB.status=${this.datastore?.db.status} dataStore.status=${(this.datastore as any)?.store?.status ?? '<n/a>'}`
    )
    const lockFiles = ['LOCK', 'LOCKS', 'CURRENT', 'MANIFEST-000001']
    for (const f of lockFiles) {
      this.logger.info(
        `[SNAPSHOT:${label}] lock? blocks/${f}=${fs.existsSync(blocks + '/' + f)} data/${f}=${fs.existsSync(data + '/' + f)}`
      )
    }
  }

  private async ensureRepoReady(label: string) {
    const repo = this.ipfsRepoPath
    const blocks = repo + '/blocks'
    const data = repo + '/data'
    this.logger.info(`[FS:${label}] ensuring repo directories exist at ${repo}`)
    fs.mkdirSync(repo, { recursive: true })
    fs.mkdirSync(blocks, { recursive: true })
    fs.mkdirSync(data, { recursive: true })

    // quick RW probe
    try {
      const p = blocks + '/.__probe__'
      fs.writeFileSync(p, 'ok')
      fs.unlinkSync(p)
      this.logger.info(`[FS:${label}] RW probe blocks OK`)
    } catch (e) {
      this.logger.error(`[FS:${label}] RW probe blocks FAILED`, e)
    }
    try {
      const p = data + '/.__probe__'
      fs.writeFileSync(p, 'ok')
      fs.unlinkSync(p)
      this.logger.info(`[FS:${label}] RW probe data OK`)
    } catch (e) {
      this.logger.error(`[FS:${label}] RW probe data FAILED`, e)
    }
  }

  private async ensureOpen(db: Level<string, Uint8Array>, name: string) {
    this.logger.info(`[OPEN:${name}] pre-status=${db.status}`)
    if (db.status === 'open') return

    if (db.status === 'opening') {
      const t0 = Date.now()
      // @ts-ignore
      for (let i = 0; i < 50 && db.status !== 'open'; i++) {
        await this.delay(10)
      }
      this.logger.info(`[OPEN:${name}] waited ${Date.now() - t0}ms for 'opening' → status=${db.status}`)
      // @ts-ignore
      if (db.status === 'open') return
    }

    const t1 = Date.now()
    await db.open()
    this.logger.info(`[OPEN:${name}] db.open() resolved in ${Date.now() - t1}ms status=${db.status}`)

    // give one tick for some environments to flip status
    await this.delay(0)
  }

  private async healthCheck(db: Level<string, Uint8Array>, name: string) {
    const key = `__health__:${Date.now()}`
    const t0 = Date.now()
    try {
      await db.put(key, Buffer.from('ok'))
      const v = await db.get(key)
      await db.del(key)
      this.logger.info(
        `[HEALTH:${name}] put/get/del OK in ${Date.now() - t0}ms len=${(v as Uint8Array)?.length ?? 'n/a'}`
      )
    } catch (e) {
      this.logger.error(`[HEALTH:${name}] FAILED in ${Date.now() - t0}ms`, e)
      throw e
    }
  }

  private async openStore(store: { open: () => Promise<void> }, name: string) {
    const tryOpen = async (attempt: number) => {
      this.logger.info(`[STORE-OPEN:${name}] attempt ${attempt}`)
      await store.open()
      this.logger.info(`[STORE-OPEN:${name}] opened on attempt ${attempt}`)
    }

    try {
      await tryOpen(1)
    } catch (e: any) {
      const msg = e?.message || String(e)
      this.logger.error(`[STORE-OPEN:${name}] attempt 1 failed: ${msg}`)
      this.snapshot(`store-open-fail:${name}:1`)
      if (/not open/i.test(msg) || /Database is not open/i.test(msg)) {
        await this.delay(100)
        try {
          await tryOpen(2)
          return
        } catch (e2: any) {
          this.logger.error(`[STORE-OPEN:${name}] attempt 2 failed: ${e2?.message || e2}`)
          this.snapshot(`store-open-fail:${name}:2`)
          await this.delay(200)
          try {
            await tryOpen(3)
            return
          } catch (e3) {
            this.logger.error(`[STORE-OPEN:${name}] attempt 3 failed`)
            throw e3
          }
        }
      }
      throw e
    }
  }

  constructor(
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    public readonly libp2pService: Libp2pService
  ) {
    this.started = false
  }

  public async createInstance(): Promise<HeliaLibp2p> {
    const libp2pInstance = this.libp2pService?.libp2pInstance

    let ipfs: HeliaLibp2p
    try {
      if (!libp2pInstance) {
        this.logger.error('Libp2p instance required')
        throw new Error('Libp2p instance required')
      }

      this.logger.info(`Initializing Helia datastore and blockstore`)
      await this.initializeStores()
      this.snapshot('createInstance:post-init-stores')

      // Ensure stores are open before constructing Helia
      await this.openStores()
      this.snapshot('createInstance:post-open-stores')

      this.logger.info(`Creating Helia instance`)
      const bitstwapInstance = bitswap({
        incomingStreamTimeout: 60_000,
        sendBlocksTimeout: 30_000,
        sendBlocksDebounce: 10,
        // @ts-expect-error This is part of the config interface but it isn't typed that way
        messageReceiveTimeout: 30_000,
        protocol: BITSWAP_PROTOCOL,
        maxInboundStreams: 512,
        maxOutboundStreams: 512,
        sendBlocksConcurrency: 10,
      })
      ipfs = await createHelia({
        start: false,
        libp2p: libp2pInstance,
        blockstore: this.blockstore!.store,
        datastore: this.datastore!.store,
        blockBrokers: [bitstwapInstance],
      })
      this.ipfsInstance = ipfs
    } catch (error) {
      this.logger.error('IPFS creation failed', error)
      throw new Error('IPFS creation failed')
    }

    return this.ipfsInstance
  }

  private async initializeStores(init?: StoreInit): Promise<void> {
    await this.ensureRepoReady('initializeStores')
    this.snapshot('initializeStores:before-create')

    this.logger.info('[DEBUG] Initializing Datastore with options:', init?.datastore)
    this.datastore = await this.createDatastore(init?.datastore)
    this.logger.info(
      '[DEBUG] Datastore initialized:',
      util.inspect(
        {
          dbType: typeof this.datastore.db,
          dbKeys: Object.keys(this.datastore.db),
          dbLocation: this.datastore.db.location,
          dbState: this.datastore.db.status,
          storeType: typeof this.datastore.store,
          storeKeys: Object.keys(this.datastore.store),
        },
        { depth: 3, colors: false }
      )
    )
    this.logger.info('[DEBUG] Initializing Blockstore with options:', init?.blockstore)
    this.blockstore = await this.createBlockstore(init?.blockstore)
    this.logger.info(
      '[DEBUG] Blockstore initialized:',
      util.inspect(
        {
          dbType: typeof this.blockstore.db,
          dbKeys: Object.keys(this.blockstore.db),
          dbLocation: this.blockstore.db.location,
          dbState: this.blockstore.db.status,
          storeType: typeof this.blockstore.store,
          storeKeys: Object.keys(this.blockstore.store),
        },
        { depth: 3, colors: false }
      )
    )
    this.snapshot('initializeStores:after-create')
  }

  private async createDatastore(init?: DatabaseOptions<string, Uint8Array>): Promise<Datastore> {
    let datastoreInit: DatabaseOptions<string, Uint8Array> = {
      keyEncoding: 'utf8',
      valueEncoding: 'buffer',
      createIfMissing: true,
      errorIfExists: false,
      version: 1,
    }

    if (init != null) {
      datastoreInit = {
        ...datastoreInit,
        ...init,
      }
    }

    if (datastoreInit.valueEncoding != 'buffer') {
      throw new Error(`Datastore valueEncoding was set to ${datastoreInit.valueEncoding} but MUST be set to 'buffer'!`)
    }

    if (datastoreInit.keyEncoding != 'utf8') {
      throw new Error(`Datastore keyEncoding was set to ${datastoreInit.keyEncoding} but MUST be set to 'utf8'!`)
    }

    const datastoreLevelDb = new Level<string, Uint8Array>(this.ipfsRepoPath + '/data', datastoreInit)
    return {
      db: datastoreLevelDb,
      store: new LevelDatastore(datastoreLevelDb, datastoreInit),
    }
  }

  private async createBlockstore(init?: LevelBlockstoreInit): Promise<Blockstore> {
    let blockstoreInit: LevelBlockstoreInit = {
      keyEncoding: 'utf8',
      valueEncoding: 'buffer',
      createIfMissing: true,
      errorIfExists: false,
      version: 1,
    }

    if (init != null) {
      blockstoreInit = {
        ...blockstoreInit,
        ...init,
      }
    }

    if (blockstoreInit.valueEncoding != 'buffer') {
      throw new Error(
        `Blockstore valueEncoding was set to ${blockstoreInit.valueEncoding} but MUST be set to 'buffer'!`
      )
    }

    if (blockstoreInit.keyEncoding != 'utf8') {
      throw new Error(`Blockstore keyEncoding was set to ${blockstoreInit.keyEncoding} but MUST be set to 'utf8'!`)
    }

    const blockstoreLevelDb = new Level<string, Uint8Array>(this.ipfsRepoPath + '/blocks', blockstoreInit)
    return {
      db: blockstoreLevelDb,
      store: new LevelBlockstore(blockstoreLevelDb, blockstoreInit),
    }
  }

  private async openStoresCore(): Promise<void> {
    if (!this.blockstore || !this.datastore) {
      this.logger.error('Blockstore or datastore is not initialized')
      throw new Error('Blockstore or datastore is not initialized')
    }

    this.snapshot('openStores:begin')

    // Blockstore: open DB → health → open store
    await this.ensureOpen(this.blockstore.db, 'block-db')
    await this.healthCheck(this.blockstore.db, 'block-db')
    await this.delay(0) // yield a tick
    await this.openStore(this.blockstore.store as any, 'block-store')

    // Datastore: open DB → health → open store
    await this.ensureOpen(this.datastore.db, 'data-db')
    await this.healthCheck(this.datastore.db, 'data-db')
    await this.delay(0)
    await this.openStore(this.datastore.store as any, 'data-store')

    this.snapshot('openStores:end')
  }

  public async openStores(): Promise<void> {
    return this.withLifecycleLock('openStores', async () => {
      await this.openStoresCore()
    })
  }

  public async start() {
    return this.withLifecycleLock('start', async () => {
      this.logger.info(`Starting IPFS Service`)
      if (!this.ipfsInstance) {
        throw new Error('IPFS instance does not exist')
      }

      // idempotent: ensure stores are open if needed
      this.snapshot('start:pre-openStores')
      await this.openStoresCore()
      this.snapshot('start:post-openStores')

      this.logger.info(`Starting Helia`)
      await this.ipfsInstance.start()
      this.snapshot('start:post-helia-start')

      this.started = true
      this.logger.info(`IPFS Service has started`)
    })
  }

  public isStarted() {
    return this.started
  }

  public async stop() {
    this.snapshot('stop:begin')

    this.logger.info('Stopping IPFS')

    try {
      this.logger.info('[DEBUG] Stopping IPFS instance')
      await this.ipfsInstance?.stop()
      this.logger.info('[DEBUG] Stopped IPFS instance')
    } catch (e) {
      this.logger.error('[DEBUG] Error while closing IPFS instance', e)
      this.logger.error('[DEBUG] Error stack:', e?.stack)
      if (!(e as Error).message.includes('Database is not open')) {
        throw e
      }
    }

    // gives libp2p a tick to close its services
    await new Promise<void>(r => setImmediate(r))

    try {
      this.logger.info('[DEBUG] Closing blockstore store')
      await this.blockstore?.store.close()
      this.logger.info('[DEBUG] Closed blockstore store')
    } catch (e) {
      this.logger.error('[DEBUG] Error while closing IPFS blockstore', e)
      this.logger.error('[DEBUG] Error stack:', e?.stack)
      if (!(e as Error).message.includes('Database is not open')) {
        throw e
      }
    }

    try {
      this.logger.info('[DEBUG] Closing blockstore db')
      await this.blockstore?.db.close()
      this.logger.info('[DEBUG] Closed blockstore db')
    } catch (e) {
      this.logger.error('[DEBUG] Error while closing IPFS blockstore db', e)
      this.logger.error('[DEBUG] Error stack:', e?.stack)
      if (!(e as Error).message.includes('Database is not open')) {
        throw e
      }
    }
    await this.delay(0)

    try {
      this.logger.info('[DEBUG] Closing datastore store')
      await this.datastore?.store.close()
      this.logger.info('[DEBUG] Closed datastore store')
    } catch (e) {
      this.logger.error('[DEBUG] Error while closing IPFS datastore', e)
      this.logger.error('[DEBUG] Error stack:', e?.stack)
      if (!(e as Error).message.includes('Database is not open')) {
        throw e
      }
    }

    try {
      this.logger.info('[DEBUG] Closing datastore db')
      await this.datastore?.db.close()
      this.logger.info('[DEBUG] Closed datastore db')
    } catch (e) {
      this.logger.error('[DEBUG] Error while closing IPFS datastore db', e)
      this.logger.error('[DEBUG] Error stack:', e?.stack)
      if (!(e as Error).message.includes('Database is not open')) {
        throw e
      }
    }
    await this.delay(0)

    this.snapshot('stop:end')
    this.started = false
  }

  public async destroyInstance() {
    try {
      await this.stop()
    } catch (error) {
      this.logger.error('Error while destroying IPFS instance', error)
    }
    this.ipfsInstance = null
    this.blockstore = null
    this.datastore = null
  }
}
