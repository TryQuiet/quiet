

const DEFAULT_CHUNK_SIZE = 10

export class ProcessInChunks<T> {
  private isActive: boolean
  private data: T[]
  private chunkSize: number
  private processItem: (arg: T) => Promise<any>

  constructor(data: T[], processItem: (arg: T) => Promise<any>, chunkSize: number = DEFAULT_CHUNK_SIZE) {
    this.data = data
    this.processItem = processItem
    this.chunkSize = chunkSize
    this.isActive = true
  }

  async processOneItem() {
    if (!this.isActive) return
    const toProcess = this.data.shift()
    if (toProcess) {
      try {
        await this.processItem(toProcess)
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
    log(`Processing ${Math.min(this.chunkSize, this.data.length)} items`)
    for (let i = 0; i < this.chunkSize; i++) {
      // Do not wait for this promise as items should be processed simultineously
      void this.processOneItem()
    }
  }

  stop() {
    if (this.isActive) {
      log('Stopping initial dial')
      this.isActive = false
    }
  }
}
