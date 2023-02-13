import { Multiaddr } from 'multiaddr'
import logger from '../logger'
const log = logger('dialer')

export class ProcessInChunks {
  CHUNK_SIZE = 10
  isActive: boolean

  constructor(private data: string[], private processItem: (arg: any) => Promise<any>) {
    this.isActive = true
  }

  async processOneItem() {
    if (!this.isActive) return
    const toProcess = this.data.shift()
    if (toProcess) {
      try {
        await this.processItem(new Multiaddr(toProcess))
      } catch (e) {
        log(`Processing ${toProcess} failed, message:`, e.message)
      } finally {
        process.nextTick(async () => {
          await this.processOneItem()
        })
      }
    }
  }

  async process() {
    log(`Processing ${Math.min(this.CHUNK_SIZE, this.data.length)} items`)
    for (let i = 0; i < this.CHUNK_SIZE; i++) {
      await this.processOneItem()
    }
  }

  stop() {
    log('Stopping initial dial')
    this.isActive = false
  }
}
