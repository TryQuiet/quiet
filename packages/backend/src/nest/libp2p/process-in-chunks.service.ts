import { EventEmitter } from 'events'
import fastq, { queueAsPromised } from 'fastq'

import Logger from '../common/logger'
import CryptoJS, { MD5 } from 'crypto-js'

const DEFAULT_CHUNK_SIZE = 10
export const DEFAULT_NUM_TRIES = 2

type ProcessTask<T> = {
  data: T
  tries: number
  taskId: string
}

export type ProcessInChunksServiceOptions<T> = {
  initialData: T[]
  processItem: (arg: T) => Promise<any>
  chunkSize?: number | undefined
  startImmediately?: boolean
}

export class ProcessInChunksService<T> extends EventEmitter {
  private isActive: boolean
  private chunkSize: number
  private taskQueue: queueAsPromised<ProcessTask<T>>
  private deadLetterQueue: ProcessTask<T>[] = []
  private runningTaskIds: Set<string> = new Set()
  private processItem: (arg: T) => Promise<boolean>
  private readonly logger = Logger(ProcessInChunksService.name)
  constructor() {
    super()
  }

  public init(options: ProcessInChunksServiceOptions<T>) {
    this.logger(`Initializing process-in-chunks.service with peers ${JSON.stringify(options.initialData, null, 2)}`)
    this.processItem = options.processItem
    this.chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE
    this.taskQueue = fastq.promise(this, this.processOneItem, this.chunkSize)
    const startImmediately = options.startImmediately ?? true
    if (startImmediately) {
      this.logger(`Starting processing immediately`)
      this.isActive = true
    } else {
      this.logger(`Deferring processing`)
      this.pause()
    }
    this.updateQueue(options.initialData)
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
      task = { data: itemOrTask as T, tries: 0, taskId: this.generateTaskId(itemOrTask as T) }
    }

    if (this.isTaskDuplicate(task.taskId)) {
      return
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
      success = await this.processItem(task.data)
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
    this.runningTaskIds.add(task.taskId)
    const success = await this.taskQueue.push(task)
    this.runningTaskIds.delete(task.taskId)
    if (success) {
      this.logger(`Task ${task.taskId} completed successfully`)
    } else {
      this.logger(`Task ${task.taskId} failed`)
    }
    return success
  }

  private isTaskDuplicate(taskId: string): boolean {
    if (!this.isActive) {
      this.logger(
        'ProcessInChunksService is not active, adding tasks to the dead letter queue!\n\nWARNING: You must call "resume" on the ProcessInChunksService to process the dead letter queue!!!'
      )
      return this.deadLetterQueue.find(thisTask => thisTask.taskId === taskId) != null
    }

    if (this.runningTaskIds.has(taskId)) {
      this.logger(`Skipping task with ID ${taskId} because there is another task with the same ID currently running.`)
      return true
    }

    if (this.taskQueue.getQueue().find(thisTask => thisTask.taskId === taskId)) {
      this.logger(
        `Skipping task with ID ${taskId} because there is another task with the same ID already in the task queue.`
      )
      return true
    }

    return false
  }

  private generateTaskId(data: T): string {
    return MD5(JSON.stringify(data)).toString(CryptoJS.enc.Hex)
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
