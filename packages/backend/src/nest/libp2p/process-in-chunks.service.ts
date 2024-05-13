import { EventEmitter } from 'events'
import fastq, { queueAsPromised } from 'fastq'

import Logger from '../common/logger'
import { randomUUID } from 'crypto'

const DEFAULT_CHUNK_SIZE = 10
export const DEFAULT_NUM_TRIES = 2

type ProcessTask<T> = {
  data: T
  tries: number
  taskId: string
}

export class ProcessInChunksService<T> extends EventEmitter {
  private isActive: boolean
  private chunkSize: number
  private taskQueue: queueAsPromised<ProcessTask<T>>
  private deadLetterQueue: ProcessTask<T>[] = []
  private processItem: (arg: T) => Promise<any>
  private readonly logger = Logger(ProcessInChunksService.name)
  constructor() {
    super()
  }

  public init(data: T[], processItem: (arg: T) => Promise<any>, chunkSize: number = DEFAULT_CHUNK_SIZE) {
    this.logger(`Initializing process-in-chunks.service with peers ${JSON.stringify(data, null, 2)}`)
    this.processItem = processItem
    this.chunkSize = chunkSize
    this.taskQueue = fastq.promise(this, this.processOneItem, this.chunkSize)
    this.isActive = true
    this.updateQueue(data)
  }

  public updateQueue(items: T[]) {
    this.logger(`Adding ${items.length} items to the task queue`)
    items.forEach(item => this.addToTaskQueue(item))
  }

  private async addToTaskQueue(task: ProcessTask<T>): Promise<void>
  private async addToTaskQueue(item: T): Promise<void>
  private async addToTaskQueue(itemOrTask: T | ProcessTask<T>): Promise<void> {
    if (!itemOrTask) {
      this.logger.error('Item/task is null or undefined, skipping!')
      return
    }

    let task: ProcessTask<T>
    if ((itemOrTask as ProcessTask<T>).taskId != null) {
      task = itemOrTask as ProcessTask<T>
    } else {
      this.logger(`Creating new task for ${itemOrTask}`)
      task = { data: itemOrTask as T, tries: 0, taskId: randomUUID() }
    }

    if (!this.isActive) {
      this.logger(
        'ProcessInChunksService is not active, adding tasks to the dead letter queue!\n\nWARNING: You must call "resume" on the ProcessInChunksService to process the dead letter queue!!!'
      )
      this.deadLetterQueue.push(task)
      this.logger(`There are now ${this.deadLetterQueue.length} items in the dead letter queue`)
      return
    }

    this.logger(`Adding task ${task.taskId} with data ${task.data} to the task queue`)
    try {
      const success = await this.pushToQueueAndRun(task)
      if (!success) {
        this.logger(`Will try to re-attempt task ${task.taskId} with data ${task.data}`)
        await this.pushToQueueAndRun({ ...task, tries: task.tries + 1 })
      }
    } catch (e) {
      this.logger.error(`Error occurred while adding new task ${task.taskId} with data ${task.data} to the queue`, e)
    }
  }

  public async processOneItem(task: ProcessTask<T>): Promise<boolean> {
    let success: boolean = false
    try {
      this.logger(`Processing task ${task.taskId} with data ${task.data}`)
      await this.processItem(task.data)
      success = true
    } catch (e) {
      this.logger.error(`Processing task ${task.taskId} with data ${task.data} failed`, e)
    } finally {
      this.logger(`Done attempting to process task with data ${task.data}`)
    }
    return success
  }

  private async pushToQueueAndRun(task: ProcessTask<T>): Promise<boolean> {
    this.logger(
      `Pushing task ${task.taskId} to queue, there will now be ${this.taskQueue.length() + 1} items in the queue`
    )
    const success = await this.taskQueue.push(task)
    if (success) {
      this.logger(`Task ${task.taskId} completed successfully`)
    } else {
      this.logger(`Task ${task.taskId} failed`)
    }
    return success
  }

  public resume() {
    if (this.isActive) {
      this.logger('ProcessInChunksService is already active')
      return
    }

    this.logger('Resuming ProcessInChunksService')
    this.isActive = true
    this.taskQueue.resume()
    if (this.deadLetterQueue) {
      this.logger(`Adding ${this.deadLetterQueue.length} tasks from the dead letter queue to the task queue`)
      this.deadLetterQueue.forEach(task => this.addToTaskQueue(task))
      this.deadLetterQueue = []
    }
  }

  public pause() {
    if (!this.isActive) {
      this.logger('ProcessInChunksService is already paused')
      return
    }

    this.logger('Pausing ProcessInChunksService')
    this.isActive = false
    this.deadLetterQueue = this.taskQueue.getQueue()
    this.taskQueue.kill()
    this.taskQueue.pause()
  }
}
