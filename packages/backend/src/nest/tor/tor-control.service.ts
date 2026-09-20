import { Inject, Injectable } from '@nestjs/common'
import net from 'net'
import { Mutex } from 'async-mutex'
import { raceSignal } from 'race-signal'
import { setTimeout as delay } from 'timers/promises'
import { CONFIG_OPTIONS, TOR_CONTROL_PARAMS } from '../const'
import { ConfigOptions } from '../types'
import {
  TorControlAuthType,
  TorControlParams,
  type TorControlCredentialsWaiter,
  type TorControlEventMatcher,
  type TorControlResponse,
} from './tor.types'
import { createLogger } from '../common/logger'

class TorControlAuthenticationError extends Error {}

const TOR_CONTROL_REPLY_TIMEOUT_MS = 5000
export const TOR_EVENT_TIMEOUT_MS = 120_000

@Injectable()
export class TorControl {
  connection: net.Socket | null
  isSending: boolean
  authString: string
  private readonly logger = createLogger(TorControl.name)
  private readonly commandMutex = new Mutex()
  private readonly eventConnections = new Set<net.Socket>()
  private credentialsWaiter: TorControlCredentialsWaiter | undefined
  private closed = false

  constructor(
    @Inject(TOR_CONTROL_PARAMS) public torControlParams: TorControlParams,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions
  ) {
    this.isSending = false
  }

  public get hasCredentials(): boolean {
    return Boolean(this.torControlParams.auth.value)
  }

  public waitForCredentials(): Promise<void> {
    if (this.closed) return Promise.reject(new Error('Tor control is closed'))
    if (this.hasCredentials) return Promise.resolve()
    if (!this.credentialsWaiter) {
      let resolve!: () => void
      let reject!: (error: Error) => void
      const promise = new Promise<void>((onResolve, onReject) => {
        resolve = onResolve
        reject = onReject
      })
      this.credentialsWaiter = { promise, resolve, reject }
      this.logger.debug('Waiting for Tor control credentials')
    }
    return this.credentialsWaiter.promise
  }

  public updateConnectionParams(params: TorControlParams): void {
    this.torControlParams = { ...params, auth: { ...params.auth } }
    if (this.hasCredentials) {
      this.credentialsWaiter?.resolve()
      this.credentialsWaiter = undefined
    }
  }

  public onModuleDestroy(): void {
    this.closed = true
    this.commandMutex.cancel()
    this.credentialsWaiter?.reject(new Error('Tor control is closed'))
    this.credentialsWaiter = undefined
    for (const connection of this.eventConnections) connection.end()
    this.eventConnections.clear()
    this.connection?.destroy()
    this.disconnect()
  }

  private updateAuthString() {
    if (this.torControlParams.auth.type === TorControlAuthType.PASSWORD) {
      this.authString = 'AUTHENTICATE "' + this.torControlParams.auth.value + '"\r\n'
    }
    if (this.torControlParams.auth.type === TorControlAuthType.COOKIE) {
      // Cookie authentication must be invoked as a hexadecimal string passed without double quotes
      this.authString = 'AUTHENTICATE ' + this.torControlParams.auth.value + '\r\n'
    }
  }

  private async _connect(signal?: AbortSignal): Promise<void> {
    const connection = net.connect({
      host: this.torControlParams.host,
      port: this.torControlParams.port,
      family: 4,
    })
    this.connection = connection
    // Keep late socket errors handled after a request has been cancelled. They
    // belong to this socket and must not disconnect the next command's socket.
    connection.on('error', () => undefined)
    try {
      this.updateAuthString()
      await this.request(connection, this.authString.trimEnd(), signal)
    } catch (error) {
      connection.end()
      if (error instanceof Error && /^515\b/.test(error.message)) {
        throw new TorControlAuthenticationError(error.message)
      }
      throw error
    }
  }

  private async connect(signal?: AbortSignal): Promise<void> {
    // TODO: We may want to limit the number of connection attempts.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      signal?.throwIfAborted()
      await raceSignal(this.waitForCredentials(), signal)
      try {
        this.logger.debug(`Connecting to Tor, host: ${this.torControlParams.host} port: ${this.torControlParams.port}`)
        await this._connect(signal)
        return
      } catch (e) {
        signal?.throwIfAborted()
        if (this.closed) throw new Error('Tor control is closed')
        // Retrying the same rejected credentials cannot repair authentication.
        // Let the caller recover or a native rewire install fresh credentials.
        if (e instanceof TorControlAuthenticationError) throw e
        this.logger.error('Retrying due to error...', e)
        await delay(500, undefined, { signal })
      }
    }
  }

  private disconnect() {
    try {
      this.connection?.end()
    } catch (e) {
      this.logger.error('Disconnect failed:', e)
    }
    this.connection = null
  }

  public _sendCommand(command: string, signal?: AbortSignal): Promise<TorControlResponse> {
    return this.request(this.connection, command, signal)
  }

  /** Authentication and commands share framing, reply deadlines and cancellation. */
  private request(connection: net.Socket | null, command: string, signal?: AbortSignal): Promise<TorControlResponse> {
    return new Promise((resolve, reject) => {
      signal?.throwIfAborted()
      const cleanup = () => {
        clearTimeout(connectionTimeout)
        connection?.off('data', onData)
        connection?.off('error', onError)
        connection?.off('close', onClose)
        signal?.removeEventListener('abort', onAbort)
      }
      const onAbort = () => {
        cleanup()
        reject(signal?.reason)
      }
      const connectionTimeout = setTimeout(() => {
        cleanup()
        reject(new Error('Timeout while waiting for Tor control reply'))
      }, TOR_CONTROL_REPLY_TIMEOUT_MS)

      let buffer = ''
      const messages: string[] = []
      let inDataBlock = false
      const onData = (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          messages.push(line)
          if (inDataBlock) {
            if (line === '.') inDataBlock = false
            continue
          }
          if (/^\d{3}\+/.test(line)) {
            inDataBlock = true
            continue
          }
          if (!/^\d{3} /.test(line)) continue
          cleanup()
          if (line.startsWith('250 ')) resolve({ code: 250, messages })
          else reject(new Error(line))
          return
        }
      }
      const onError = (error: Error) => {
        cleanup()
        reject(error)
      }
      const onClose = () => onError(new Error('Tor control connection closed before its command reply'))
      connection?.once('error', onError)
      connection?.once('close', onClose)

      signal?.addEventListener('abort', onAbort, { once: true })
      connection?.on('data', onData)
      connection?.write(command + '\r\n')
    })
  }

  public async sendCommand(command: string, signal?: AbortSignal): Promise<TorControlResponse> {
    return this.commandMutex.runExclusive(async () => {
      // Every command path shares this gate, including ADD_ONION during community creation.
      signal?.throwIfAborted()
      await raceSignal(this.waitForCredentials(), signal)
      const commandName = command.trim().split(/\s+/, 1)[0]?.toUpperCase() || 'UNKNOWN'
      this.logger.debug('Sending Tor command', { command: commandName })
      this.isSending = true
      try {
        await this.connect(signal)
        signal?.throwIfAborted()
        const res = await this._sendCommand(command, signal)
        this.logger.debug('Tor command response', {
          command: commandName,
          code: res.code,
          messageCount: res.messages.length,
        })
        return res
      } finally {
        this.disconnect()
        this.isSending = false
      }
    })
  }

  public async getDetachedOnionServices(signal?: AbortSignal): Promise<Set<string>> {
    const response = await this.sendCommand('GETINFO onions/detached', signal)
    const addresses = response.messages
      .map(line => line.replace(/^250[-+]onions\/detached=/, ''))
      .filter(line => line !== '.' && !/^\d{3}[ +-]/.test(line))
      .flatMap(line => line.split(/\s+/).filter(Boolean))
    return new Set(addresses)
  }

  /**
   * Subscribes before sending a command so a fast asynchronous Tor event cannot
   * race the command response. Events received before the response are retained
   * and matched once the response is available. A null timeout observes Tor's
   * own publication retries until the owning session's signal is aborted.
   */
  public async sendCommandAndWaitForEvent(
    command: string,
    eventCode: string,
    matchesEvent: TorControlEventMatcher,
    timeoutMs: number | null = TOR_EVENT_TIMEOUT_MS,
    signal?: AbortSignal
  ): Promise<TorControlResponse> {
    return this.waitForEventAfter(() => this.sendCommand(command, signal), eventCode, matchesEvent, timeoutMs, signal)
  }

  public async waitForEventAfter(
    operation: () => Promise<TorControlResponse>,
    eventCode: string,
    matchesEvent: TorControlEventMatcher,
    timeoutMs: number | null = TOR_EVENT_TIMEOUT_MS,
    signal?: AbortSignal
  ): Promise<TorControlResponse> {
    if (timeoutMs === null && signal == null) throw new Error('An unbounded Tor event observer requires cancellation')
    signal?.throwIfAborted()
    await raceSignal(this.waitForCredentials(), signal)

    const events: string[] = []
    let notifyEvent: (() => void) | undefined
    let rejectEvent: ((error: Error) => void) | undefined
    let response: TorControlResponse | undefined
    let buffer = ''
    let state: 'authenticating' | 'subscribing' | 'subscribed' = 'authenticating'
    let settled = false

    const connection = net.connect({
      host: this.torControlParams.host,
      port: this.torControlParams.port,
      family: 4,
    })
    this.eventConnections.add(connection)

    const close = () => {
      this.eventConnections.delete(connection)
      connection.end()
    }

    const eventPromise = new Promise<void>((resolve, reject) => {
      notifyEvent = () => {
        if (!response) return
        const matchingEvent = events.find(event => matchesEvent(event, response as TorControlResponse))
        events.length = 0
        if (!matchingEvent || settled) return
        settled = true
        resolve()
      }
      rejectEvent = error => {
        if (settled) return
        settled = true
        reject(error)
      }
    })
    // The command can still be in flight when the event connection fails.
    // Attach a handler immediately and rethrow when the promise is awaited below.
    void eventPromise.catch(() => undefined)

    let resolveSubscription!: () => void
    let rejectSubscription!: (error: Error) => void
    const subscriptionPromise = new Promise<void>((resolve, reject) => {
      resolveSubscription = resolve
      rejectSubscription = reject
    })

    const setupTimeout = setTimeout(() => {
      rejectSubscription(new Error(`Timeout while subscribing to Tor ${eventCode} events`))
    }, TOR_CONTROL_REPLY_TIMEOUT_MS)

    connection.on('error', error => {
      const wrapped = new Error(`Tor control event connection failed: ${error.message}`)
      if (state === 'subscribed') rejectEvent?.(wrapped)
      else rejectSubscription(wrapped)
    })
    connection.on('close', () => {
      if (settled) return
      const error = new Error(`Tor control event connection closed while waiting for ${eventCode}`)
      if (state === 'subscribed') rejectEvent?.(error)
      else rejectSubscription(error)
    })
    connection.on('data', data => {
      buffer += data.toString()
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line) continue
        if (state === 'authenticating') {
          if (line.startsWith('250')) {
            state = 'subscribing'
            connection.write(`SETEVENTS ${eventCode}\r\n`)
          } else if (/^5\d\d\b/.test(line)) {
            rejectSubscription(new Error(`Tor control authentication failed: ${line}`))
          }
          continue
        }
        if (state === 'subscribing') {
          if (line.startsWith('250')) {
            state = 'subscribed'
            clearTimeout(setupTimeout)
            resolveSubscription()
          } else if (/^5\d\d\b/.test(line)) {
            rejectSubscription(new Error(`Tor control event subscription failed: ${line}`))
          }
          continue
        }
        if (line.startsWith(`650 ${eventCode} `)) {
          events.push(line)
          notifyEvent?.()
        }
      }
    })

    this.updateAuthString()
    connection.write(this.authString)

    let eventTimeout: NodeJS.Timeout | undefined
    try {
      await raceSignal(subscriptionPromise, signal)
      response = await raceSignal(operation(), signal)
      notifyEvent?.()
      const completion =
        timeoutMs === null
          ? eventPromise
          : Promise.race([
              eventPromise,
              new Promise<void>((_, reject) => {
                eventTimeout = setTimeout(
                  () => reject(new Error(`Timeout while waiting for Tor ${eventCode} event`)),
                  timeoutMs
                )
              }),
            ])
      await raceSignal(completion, signal)
      return response
    } finally {
      clearTimeout(setupTimeout)
      if (eventTimeout) clearTimeout(eventTimeout)
      settled = true
      close()
    }
  }
}
