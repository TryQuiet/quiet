import * as fastq from 'fastq'
import type { queueAsPromised } from 'fastq'
import { clearTimeout, setTimeout } from 'timers'
import { createLogger } from './logger'

export interface TimedQueueProcessDef {
  task: () => Promise<void>
  key: string
  delayMs: number
}

export interface TimedQueueOptions {
  concurrency?: number
  start: boolean
  backoffFactor?: number
  fuzzFactor?: number
}

const DEFAULT_CONCURRENCY = 5
const DEFAULT_BACKOFF_FACTOR = 1.25

export class TimedQueue {
  /**
   * Task queue
   */
  private readonly queue: queueAsPromised<TimedQueueProcessDef>
  /**
   * Map of running tasks
   */
  private readonly inProcess: Map<string, NodeJS.Timeout | number> = new Map()

  private readonly logger = createLogger(TimedQueue.name)

  /**
   * Create a queue with timed tasks
   *
   * Note about options:
   *  - backoffFactor - Backoff factor determines how much the task delay increases on task failures.  Backoff is applied as `oldDelay * backoffFactor`.
   *  - fuzzFactor - Fuzz factor determines any randomness added to the delay alongside the backoff factor.  Fuzz is applied as `newDelay * (newDelay * random(0, fuzzFactor))`.
   *  - concurrency - Concurrency determines how many tasks will be processed at one time.  Importantly this only determines how many Timeout objects are created at once and not
   *                  how many Timeouts are run at once.
   *
   * @param options Options for how the queue should process tasks
   */
  constructor(private readonly options: TimedQueueOptions) {
    if (options.fuzzFactor != null && (options.fuzzFactor < 0 || options.fuzzFactor >= 1)) {
      throw new Error(`Fuzz factor must be a positive decimal less than or equal to 1`)
    }

    if (options.backoffFactor != null && options.backoffFactor < 1) {
      throw new Error(`Backoff factor must be a positive number greater than or equal to 1`)
    }

    this.queue = fastq.promise(this._processQueue.bind(this), options.concurrency ?? DEFAULT_CONCURRENCY)
    if (options.start) {
      this.start()
    } else {
      this.stop()
    }
  }

  /**
   * Start processing the queue
   */
  public start(): void {
    this.logger.info(`Starting timed queue`)
    if (!this.queue.running()) {
      this.queue.resume()
    }
  }

  /**
   * Stop processing the queue
   *
   * @param cancelTasks If true cancel all in-progress tasks
   */
  public stop(cancelTasks = false): void {
    this.logger.info(`Stopping timed queue`)
    if (this.queue.running()) {
      this.queue.pause()
      this.queue.empty()
    }

    if (cancelTasks) {
      this.logger.info(`Stopping current tasks in timed queue`)
      this.inProcess.forEach(async (task: NodeJS.Timeout | number) => {
        clearTimeout(task)
      })
    }
  }

  /**
   * Add a new task to the queue
   *
   * @param processDef Task definition
   */
  public async enqueue(processDef: TimedQueueProcessDef): Promise<void> {
    this.logger.debug(`Adding task with key ${processDef.key} to timed queue`)
    await this.queue.push(processDef)
  }

  /**
   * Process a task on the queue
   *
   * When a task is processed from the queue a new Timeout is generated that runs the task function on the process
   * definition.  In the event of a task failure the task is added back to the queue with a new delay with the
   * backoff and fuzz factors applied.
   *
   * @param processDef Task to be processed
   */
  private async _processQueue(processDef: TimedQueueProcessDef): Promise<void> {
    this.logger.debug(`Pulled task with key ${processDef.key} from queue`)
    if (this.inProcess.has(processDef.key)) {
      this.logger.debug(`Task with key ${processDef.key} already in process!`)
      return
    }

    const process = async (): Promise<void> => {
      this.logger.debug(`Processing task with key ${processDef.key}`)
      try {
        await processDef.task()
        this.inProcess.delete(processDef.key)
      } catch (e) {
        this.inProcess.delete(processDef.key)
        let newDelayMs = processDef.delayMs * (this.options.backoffFactor ?? DEFAULT_BACKOFF_FACTOR)
        newDelayMs = newDelayMs + this._generateRandomFuzz(newDelayMs)
        this.logger.warn(
          `Error while processing task with key ${processDef.key}, retrying with delay ${newDelayMs}ms`,
          e
        )
        await this.enqueue({
          ...processDef,
          delayMs: newDelayMs,
        })
      }
    }

    process.bind(this)

    const timed = setTimeout(async () => {
      await process()
    }, processDef.delayMs)
    this.inProcess.set(processDef.key, timed)
  }

  /**
   * Generate a random fuzz to modify the delay with.
   *
   * The range of possible fuzz values is (-fuzzFactor:+fuzzFactor) * delay.
   *
   * @param delayWithBackoffMs New delay in ms with the backoff factor applied
   * @returns Random fuzz in ms to be added to the delay
   */
  private _generateRandomFuzz(delayWithBackoffMs: number): number {
    if (this.options.fuzzFactor == null || this.options.fuzzFactor === 0) {
      return 0
    }
    const min = this.options.fuzzFactor * -1
    const max = this.options.fuzzFactor
    const randomFactor = Math.random() * (max - min) + min
    return delayWithBackoffMs * randomFactor
  }
}
