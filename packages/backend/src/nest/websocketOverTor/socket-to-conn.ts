// Forked from:
// https://github.com/libp2p/js-libp2p/blob/863949482bfa83ac3be2b72a4036ed9315f52d11/packages/transport-websockets/src/socket-to-conn.ts

import { AbortError, TimeoutError } from '@libp2p/interface'
import { CLOSE_TIMEOUT, SocketCloseCode } from './constants'
import type { AbortOptions, ComponentLogger, CounterGroup, MultiaddrConnection } from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { DuplexWebSocket } from 'it-ws/duplex'
import { CloseEvent, ErrorEvent, MessageEvent, WebSocket } from 'ws'
import { abortableAsyncIterable } from '../common/utils'
import { Uint8ArrayList } from 'uint8arraylist'

export interface SocketToConnOptions {
  localAddr?: Multiaddr
  logger: ComponentLogger
  metrics?: CounterGroup
  metricPrefix?: string
  signal?: AbortSignal
}

// Convert a stream into a MultiaddrConnection
// https://github.com/libp2p/interface-transport#multiaddrconnection
export function socketToMaConn(
  stream: DuplexWebSocket,
  remoteAddr: Multiaddr,
  options: SocketToConnOptions
): MultiaddrConnection {
  const log = options.logger.forComponent(`libp2p:websockets:maconn:${remoteAddr.getPeerId()}`)
  const metrics = options.metrics
  const metricPrefix = options.metricPrefix ?? ''
  const peerId = remoteAddr.getPeerId() ?? 'unknown'
  const openedAtMs = Date.now()
  let localCloseTrigger: 'maConn.close' | 'maConn.abort' | undefined
  let localCloseReason: string | undefined
  let socketCloseObserved = stream.socket.readyState === WebSocket.CLOSED
  stream.source = abortableAsyncIterable(stream.source, options.signal)

  const generateSink = (
    source: AsyncGenerator<Uint8Array | Uint8ArrayList, any, unknown>
  ): AsyncGenerator<Uint8Array, any, unknown> =>
    (async function* () {
      for await (const buf of source) {
        if (buf instanceof Uint8Array) {
          yield buf
        } else {
          yield buf.subarray()
        }
      }
    })()

  const maConn: MultiaddrConnection = {
    log,

    async sink(source) {
      try {
        await stream.sink(generateSink(source))
      } catch (err: any) {
        log.error(
          'p2p-websocket-raw %s',
          JSON.stringify(
            rawSocketLogContext({
              event: 'stream:sink:error',
              errorName: err?.name,
              errorMessage: err?.message,
              errorType: err?.type,
            })
          )
        )
        if (err.type !== 'aborted') {
          log.error(`Stream abort error`, err)
        } else {
          log.error(`Stream error`, err)
        }
      }
    },

    source: stream.source,

    remoteAddr,

    timeline: { open: Date.now() },

    async close(options: AbortOptions = {}) {
      const start = Date.now()
      const closeAlreadyObserved = socketCloseObserved || stream.socket.readyState === WebSocket.CLOSED
      if (!closeAlreadyObserved) {
        localCloseTrigger = 'maConn.close'
        localCloseReason = options.signal?.aborted === true ? 'signal-already-aborted' : 'close-called'
      }

      if (options.signal == null) {
        const signal = AbortSignal.timeout(CLOSE_TIMEOUT)

        options = {
          ...options,
          signal,
        }
      }

      const listener = (): void => {
        const { host, port } = maConn.remoteAddr.toOptions()
        localCloseReason = 'close-timeout'
        log('timeout closing stream to %s:%s after %dms, destroying it manually', host, port, Date.now() - start)

        this.abort(new TimeoutError('Socket close timeout'))
      }

      options.signal?.addEventListener('abort', listener, { once: true })
      log(
        'p2p-websocket-raw %s',
        JSON.stringify(
          rawSocketLogContext({
            event: 'maConn:close:start',
            signalAborted: options.signal?.aborted ?? false,
            closeAlreadyObserved,
          })
        )
      )

      try {
        await stream.close()
      } catch (err: any) {
        log.error('Error closing WebSocket gracefully', err)
        this.abort(err)
      } finally {
        options.signal?.removeEventListener('abort', listener)
        if (maConn.timeline.close == null) {
          maConn.timeline.close = Date.now()
        }
        log(
          'p2p-websocket-raw %s',
          JSON.stringify(
            rawSocketLogContext({
              event: 'maConn:close:end',
              closeDurationMs: Date.now() - start,
            })
          )
        )
      }
    },

    abort(err: Error): void {
      const { host, port } = maConn.remoteAddr.toOptions()
      localCloseTrigger = 'maConn.abort'
      localCloseReason = err.message
      log.error(
        'p2p-websocket-raw %s',
        JSON.stringify(
          rawSocketLogContext({
            event: 'maConn:abort',
            errorName: err.name,
            errorMessage: err.message,
          })
        )
      )
      log('timeout closing stream to %s:%s due to error', host, port, err)

      stream.destroy()
      if (maConn.timeline.close == null) {
        maConn.timeline.close = Date.now()
      }

      // ws WebSocket.terminate does not accept an Error arg to emit an 'error'
      // event on destroy like other node streams so we can't update a metric
      // with an event listener
      // https://github.com/websockets/ws/issues/1752#issuecomment-622380981
      metrics?.increment({ [`${metricPrefix}error`]: true })
    },
  }

  function rawSocketLogContext(extra: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      peerId,
      remoteAddr: remoteAddr.toString(),
      closeOrigin: localCloseTrigger == null ? 'remote-or-network' : 'local',
      localCloseTrigger: localCloseTrigger ?? null,
      localCloseReason: localCloseReason ?? null,
      socketReadyState: stream.socket.readyState,
      openedAtMs,
      ageMs: Date.now() - openedAtMs,
      timeline: maConn.timeline,
      ...extra,
    }
  }

  stream.socket.addEventListener('error', (errorEvent: ErrorEvent) => {
    log.error(
      'p2p-websocket-raw %s',
      JSON.stringify(
        rawSocketLogContext({
          event: 'socket:error',
          errorMessage: errorEvent.message,
          errorName: errorEvent.error?.name,
          errorCause: errorEvent.error?.message,
        })
      )
    )
    log.error(`Error on socket: ${errorEvent.message}`, errorEvent.error)
  })

  stream.socket.addEventListener(
    'close',
    (closeEvent: CloseEvent) => {
      socketCloseObserved = true
      if (maConn.timeline.close == null) {
        maConn.timeline.close = Date.now()
      }
      log(
        'p2p-websocket-raw %s',
        JSON.stringify(
          rawSocketLogContext({
            event: 'socket:close',
            code: closeEvent.code,
            reason: closeEvent.reason,
            wasClean: closeEvent.wasClean,
          })
        )
      )
      switch (closeEvent.code) {
        case SocketCloseCode.ERROR:
        case SocketCloseCode.INVALID_DATA:
          log.error(`Socket is closing with code ${closeEvent.code} due to error`, closeEvent.reason)
          break
        case SocketCloseCode.NORMAL:
        case SocketCloseCode.GO_AWAY:
        case SocketCloseCode.UNDEFINED:
        default:
          break
      }

      metrics?.increment({ [`${metricPrefix}close`]: true })
    },
    { once: true }
  )

  return maConn
}
