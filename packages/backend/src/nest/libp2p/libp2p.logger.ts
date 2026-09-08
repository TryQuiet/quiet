import type { PeerId } from '@libp2p/interface'
import { CallableQuietLogger, LogFormatters, LogSetting, QuietLogger } from '@quiet/logger'
import { createWinstonQuietLogger } from '@quiet/node-common'

import { CID } from 'multiformats'
import type { Key } from 'interface-datastore'
import { base32 } from 'multiformats/bases/base32'
import { base58btc } from 'multiformats/bases/base58'
import { base64 } from 'multiformats/bases/base64'
import type { Multiaddr } from '@multiformats/multiaddr'

export interface QuietLibp2pLogger {
  (formatter: string, ...args: any[]): void
  error(formatter: string, ...args: any[]): void
  trace(formatter: any, ...args: any[]): void
  warn(formatter: any, ...args: any[]): void
  enabled: boolean
}

export interface ComponentLogger {
  forComponent(name: string): CallableQuietLogger
}

export interface PeerLoggerOptions {
  prefixLength: number
  suffixLength: number
}

// setup our custom string formatters
const formatters: LogFormatters = {}

// Add a formatter for converting to a base58 string
formatters.b = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base58btc.baseEncode(v)
}

// Add a formatter for converting to a base32 string
formatters.t = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base32.baseEncode(v)
}

// Add a formatter for converting to a base64 string
formatters.m = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base64.baseEncode(v)
}

// Add a formatter for stringifying peer ids
formatters.p = (v?: PeerId): string => {
  return v == null ? 'undefined' : v.toString()
}

// Add a formatter for stringifying CIDs
formatters.c = (v?: CID): string => {
  return v == null ? 'undefined' : v.toString()
}

// Add a formatter for stringifying Datastore keys
formatters.k = (v: Key): string => {
  return v == null ? 'undefined' : v.toString()
}

// Add a formatter for stringifying Multiaddrs
formatters.a = (v?: Multiaddr): string => {
  return v == null ? 'undefined' : v.toString()
}

formatters.d = (v?: number): string => {
  return v == null ? 'NaN' : v.toString()
}

formatters.s = (v?: string): string => {
  return v == null ? 'undefined' : v
}

formatters.o = (v?: any): string => {
  return v == null ? 'undefined' : JSON.stringify(v, null, 2)
}

/**
 * Create a component logger that will prefix any log messages with a truncated
 * peer id.
 *
 * @example
 *
 * ```TypeScript
 * import { peerLogger } from '@libp2p/logger'
 * import { peerIdFromString } from '@libp2p/peer-id'
 *
 * const peerId = peerIdFromString('12D3FooBar')
 * const logger = peerLogger(peerId)
 *
 * const log = logger.forComponent('my-component')
 * log.info('hello world')
 * // logs "12…oBar:my-component hello world"
 * ```
 */
export function peerLogger(peerId: PeerId, options: Partial<PeerLoggerOptions> = {}): ComponentLogger {
  return prefixLogger(peerId.toString())
}

/**
 * Create a component logger that will prefix any log messages with the passed
 * string.
 *
 * @example
 *
 * ```TypeScript
 * import { prefixLogger } from '@libp2p/logger'
 *
 * const logger = prefixLogger('my-node')
 *
 * const log = logger.forComponent('my-component')
 * log.info('hello world')
 * // logs "my-node:my-component hello world"
 * ```
 */
export function prefixLogger(prefix: string): ComponentLogger {
  return {
    forComponent(name: string) {
      return logger(`${prefix}:${name}`)()
    },
  }
}

export function suffixLogger(suffix: string): ComponentLogger {
  return {
    forComponent(name: string) {
      return logger(`${name}:${suffix}`)()
    },
  }
}

/**
 * Create a component logger
 *
 * @example
 *
 * ```TypeScript
 * import { defaultLogger } from '@libp2p/logger'
 * import { peerIdFromString } from '@libp2p/peer-id'
 *
 * const logger = defaultLogger()
 *
 * const log = logger.forComponent('my-component')
 * log.info('hello world')
 * // logs "my-component hello world"
 * ```
 */
export function defaultLogger(): ComponentLogger {
  return {
    forComponent(name: string) {
      return logger(name)()
    },
  }
}

const isNetworkLoggingDisabled = (): boolean => {
  return process.env.NETWORK_LOGGING?.trim().toLowerCase() === 'false'
}

const makeDisabledCallable = (logger: QuietLogger): CallableQuietLogger => {
  const noop = (..._args: any[]): void => {}
  const callable = {
    LOGGER: logger,
    enabled: false,
    error: noop,
    trace: noop,
    warn: noop,
  }
  return Object.assign(noop, callable)
}
/**
 * Creates a logger for the passed component name.
 *
 * @example
 *
 * ```TypeScript
 * import { logger } from '@libp2p/logger'
 *
 * const log = logger('my-component')
 * log.info('hello world')
 * // logs "my-component hello world"
 * ```
 */
export function logger(name: string): () => CallableQuietLogger {
  return (): CallableQuietLogger => {
    const LOGGER = createWinstonQuietLogger(name, false, formatters)()

    if (isNetworkLoggingDisabled()) {
      return makeDisabledCallable(LOGGER)
    }

    const makeCallable = (logger: QuietLogger): CallableQuietLogger => {
      const callable = {
        LOGGER: logger,
        enabled: [LogSetting.DEBUG, LogSetting.TRACE].includes(logger.logSetting),
        error: (message: any, ...optionalParams: any[]) => logger.error(message, ...optionalParams),
        trace: (message: any, ...optionalParams: any[]) => logger.trace(message, ...optionalParams),
        warn: (message: any, ...optionalParams: any[]) => logger.warn(message, ...optionalParams),
      }
      const func = (message: any, ...optionalParams: any[]) => logger.info(message, ...optionalParams)
      return Object.assign(func, callable)
    }

    return makeCallable(LOGGER)
  }
}
