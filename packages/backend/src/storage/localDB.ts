import { NetworkStats, sortPeers } from "@quiet/state-manager"
import {Level} from 'level'
import path from "path"
import logger from '../logger'

const log = logger('levelDB')

export enum LocalDBKeys {
  COMMUNITY = 'community',
  REGISTRAR = 'registrar',
  PEERS = 'peers'
}

export class LocalDB {
  dbPath: string
  db: Level
  peers: any

  constructor(baseDir: string) {
    this.dbPath = path.join(baseDir, 'backendDB')
    this.db = new Level<string, any>(this.dbPath, { valueEncoding: 'json' })
    this.peers = this.db.sublevel<string, NetworkStats>(LocalDBKeys.PEERS, { valueEncoding: 'json' })
  }

  public async close() {
    log(`Closing leveldb`)
    await this.db.close()
  }

  public async get(key: string) {
    log(`Getting '${key}'`)
    let data: any
    try {
      data = await this.db.get(key)
    } catch (e) {
      log.error(`Getting '${key}'`, e)
      return null
    }
    return data
  }

  public async put(key: string, value: any) {
    log.error(`Putting '${key}': ${value}`)
    await this.db.put(key, value)
  }

  public async update(key: string, value: Object) {
    const data = await this.get(key)
    if (!data) {
      await this.put(key, value)
      return
    }
    const updatedObj = Object.assign(data, value)
    await this.put(key, updatedObj)
  }

  public async find(key: string, value: string) {
    const obj = await this.get(key)
    try {
      return obj[value]
    } catch (e) {
      log(`${value} not found in ${key}`)
      return null
    }
    
  }

  public async initPeersStats(peers: string[]) {
    // Save info about existing peers
    // Do we care about them?
    const batchOperations = []
    for (const peerAddress of peers) {
      batchOperations.push({ type: 'put', sublevel: this.peers, key: peerAddress, value: {} })
    }
    if (batchOperations.length > 0) {
      await this.db.batch(batchOperations)
    }
  }


  public async getSortedPeers(): Promise<string[]> {
    const stats = []
    const peersAddresses = []
    const peersStats = this.get(LocalDBKeys.PEERS) || {}
    for await (const [peerAddress, peerStats] of Object.entries(peersStats)) {
      console.log('peers addresses from db', peerAddress, peerStats)
      stats.push(peerStats)
      peersAddresses.push(peerAddress)
    }
    return sortPeers(peersAddresses, stats)
  }

}