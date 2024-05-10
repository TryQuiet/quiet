import { EventEmitter } from 'events'
import fastq from 'fastq'
import type { queue, done } from 'fastq'

import { createLogger } from '../common/logger'

const DEFAULT_CHUNK_SIZE = 10
export const DEFAULT_NUM_TRIES = 2

type ProcessTask<T> = {
  data: T
  tries: number
}

export class ProcessInChunksService<T> extends EventEmitter {
  private isActive: boolean
  private data: Set<T> = new Set()
  private chunkSize: number
  private taskQueue: queue<ProcessTask<T>>
  private processItem: (arg: T) => Promise<any>
  private readonly logger = createLogger(ProcessInChunksService.name)
  constructor() {
    super()
  }

  public init(data: T[], processItem: (arg: T) => Promise<any>, chunkSize: number = DEFAULT_CHUNK_SIZE) {
    this.logger.info(`Initializing process-in-chunks.service with peers`, data)
    this.processItem = processItem
    this.chunkSize = chunkSize
    this.taskQueue = fastq(this, this.processOneItem, this.chunkSize)
    this.updateData(data)
    this.addToTaskQueue()
  }

  public updateData(items: T[]) {
    this.logger.info(`Updating data with ${items.length} items`)
    this.taskQueue.pause()
    items.forEach(item => this.data.add(item))
    this.addToTaskQueue()
  }

  private addToTaskQueue() {
    this.logger.info(`Adding ${this.data.size} items to the task queue`)
    for (const item of this.data) {
      if (item) {
        this.logger.info(`Adding data ${item} to the task queue`)
        this.data.delete(item)
        try {
          this.taskQueue.push({ data: item, tries: 0 } as ProcessTask<T>)
        } catch (e) {
          this.logger.error(`Error occurred while adding new task for item ${item} to the queue`, e)
          this.data.add(item)
        }
      }
    }
  }

  public async processOneItem(task: ProcessTask<T>) {
    try {
      this.logger.info(`Processing task with data ${task.data}`)
      await this.processItem(task.data)
    } catch (e) {
      this.logger.error(`Processing task with data ${task.data} failed`, e)
      if (task.tries + 1 < DEFAULT_NUM_TRIES) {
        this.logger.warn(`Will try to re-attempt task with data ${task.data}`)
        this.taskQueue.push({ ...task, tries: task.tries + 1 })
      }
    } finally {
      this.logger.info(`Done attempting to process task with data ${task.data}`)
    }
  }

  public async process() {
    this.logger.info(`Processing ${this.taskQueue.length()} items`)
    this.taskQueue.resume()
  }

  public stop() {
    if (this.isActive) {
      this.logger.info('Stopping initial dial')
      this.isActive = false
      this.taskQueue.pause()
    }
  }
}
