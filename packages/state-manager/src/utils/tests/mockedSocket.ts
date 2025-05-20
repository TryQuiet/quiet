import SocketIOMock from 'socket.io-mock'
import { SocketActionsMap } from '@quiet/types'
import { jest } from '@jest/globals'
import factoryGirl from 'factory-girl'
import { getSocketFactory } from './factories'
import { createLogger } from '../logger'

const logger = createLogger('mockedSocket')
export class MockedSocket extends SocketIOMock {
  private expectedResponse: Map<keyof SocketActionsMap, any[]> = new Map()

  public disconnect = jest.fn((): this => this)

  // Stable, testable emit
  public emit: <Ev extends keyof SocketActionsMap>(
    ev: Ev,
    payload: Parameters<SocketActionsMap[Ev]>[0],
    callback?: (response: any) => void
  ) => this

  constructor() {
    super()
    this.emit = ((ev, payload, callback) => {
      void this._handleEmit(ev, payload, callback)
      return this
    }) as typeof this.emit
  }

  private async _handleEmit<Ev extends keyof SocketActionsMap>(
    ev: Ev,
    payload: Parameters<SocketActionsMap[Ev]>[0],
    callback?: (response: any) => void
  ): Promise<this> {
    if (callback) {
      const expected = this.popExpectedResponse(ev)
      logger.info(`Found registered response for event ${ev}:`, expected)
      const response = expected !== undefined ? expected : await this.buildResponse(ev)
      logger.info(`Emitting event ${ev} with payload:`, payload, 'and response:', response)
      setImmediate(() => callback(response)) // Ensures proper async resolution
      return this
    }
    return this
  }

  public registerExpectedResponse<Ev extends keyof SocketActionsMap>(ev: Ev, response: any): void {
    logger.info(`Registering expected response for event ${ev}:`, response)
    if (!this.expectedResponse.has(ev)) {
      this.expectedResponse.set(ev, [])
    }
    this.expectedResponse.get(ev)!.push(response)
  }

  private popExpectedResponse<Ev extends keyof SocketActionsMap>(ev: Ev): any | undefined {
    logger.info(`Popping ${ev} response from queue ${this.expectedResponse.get(ev)?.length}`)
    const queue = this.expectedResponse.get(ev)
    if (queue && queue.length > 0) {
      return queue.shift()
    }
    return undefined
  }

  public emitWithAck<Ev extends keyof SocketActionsMap>(
    ev: Ev,
    payload: Parameters<SocketActionsMap[Ev]>[0]
  ): Promise<any> {
    return new Promise(resolve => {
      try {
        this.emit(ev, payload, resolve)
      } catch (error) {
        logger.error('Error emitting event', error)
        resolve(undefined)
      }
    })
  }

  public async buildResponse<Ev extends keyof SocketActionsMap>(
    ev: Ev,
    overrides?: Partial<any>,
    factory?: factoryGirl.FactoryGirl
  ): Promise<any> {
    const responseDefinition = `${ev}_response`
    const socketFactory = factory || (await getSocketFactory())
    const base = await socketFactory.build(responseDefinition, overrides)
    return base
  }
}
