import { Inject, Injectable, Logger } from '@nestjs/common'
import { Level } from 'level'
import { NetworkStats } from '@quiet/types'
import { sortPeers } from '@quiet/common'
import { LocalDBKeys } from '../../storage/localDB'
import { LEVEL_DB } from '../const'
import { LocalDbStatus } from './local-db.types'

@Injectable()
export class LocalDbService {
  peers: any
  private readonly logger = new Logger(LocalDbService.name)
  constructor(@Inject(LEVEL_DB) private readonly db: Level) {
    setInterval(() => console.log('constructor log local db', this.getStatus()), 1000)
  }

  public async close() {
    this.logger.log('Closing leveldb')
    await this.db.close()
  }

  public async open() {
    this.logger.log('Opening leveldb')
    await this.db.open()
  }

  public getStatus(): LocalDbStatus {
    return this.db.status
  }

  public async purge() {
    await this.db.clear()
  }

  public async get(key: string) {
    let data: any
    try {
      data = await this.db.get(key)
    } catch (e) {
      this.logger.error(`Getting '${key}'`, e)
      return null
    }
    return data
  }

  public async put(key: string, value: any) {
    await this.db.put(key, value)
  }

  public async update(key: string, value: Object) {
    /**
     * Update data instead of replacing it
     */
    const data = await this.get(key)
    if (!data) {
      await this.put(key, value)
      return null
    }
    const updatedObj = Object.assign(data, value)
    await this.put(key, updatedObj)
  }

  public async find(key: string, value: string) {
    /**
     * Find and return nested key
     */
    const obj = await this.get(key)
    try {
      return obj[value]
    } catch (e) {
      this.logger.log(`${value} not found in ${key}`)
      return null
    }
  }

  public async getSortedPeers(peers: string[] = []): Promise<string[]> {
    const peersStats = await this.get(LocalDBKeys.PEERS) || {}
    const peersAddresses: string[] = [...new Set(Object.keys(peersStats).concat(peers))]
    const stats: NetworkStats[] = Object.values(peersStats)
    const sortedPeers = sortPeers(peersAddresses, stats)
    return sortedPeers
  }
}
