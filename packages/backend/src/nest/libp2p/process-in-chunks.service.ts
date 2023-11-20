import { EventEmitter } from 'events'
import Logger from '../common/logger'

const DEFAULT_CHUNK_SIZE = 10

export class ProcessInChunksService<T> extends EventEmitter {
  private isActive: boolean
  private data: T[]
  private chunkSize: number
  private processItem: (arg: T) => Promise<any>
  private readonly logger = Logger(ProcessInChunksService.name)
  constructor() {
    super()
  }

  public init(data: T[], processItem: (arg: T) => Promise<any>, chunkSize: number = DEFAULT_CHUNK_SIZE) {
    this.data = data
    this.processItem = processItem
    this.chunkSize = chunkSize
  }

  updateData(items: T[]) {
    this.logger(`Updating data with ${items.length} items`)
    this.data = [...new Set(this.data.concat(items))]
  }

  public async processOneItem() {
    const toProcess = this.data.shift()
    if (toProcess) {
      try {
        await this.processItem(toProcess)
      } catch (e) {
        this.logger(`Processing ${toProcess} failed, message:`, e.message)
      } finally {
        process.nextTick(async () => {
          await this.processOneItem()
        })
      }
    }
  }

  public async process() {
    this.logger(`Processing ${this.data.length} items`)
    for (let i = 0; i < this.chunkSize; i++) {
      // Do not wait for this promise as items should be processed simultineously
      void this.processOneItem()
    }
  }

  public stop() {
    if (this.isActive) {
      this.logger('Stopping initial dial')
      this.isActive = false
    }
  }
}
