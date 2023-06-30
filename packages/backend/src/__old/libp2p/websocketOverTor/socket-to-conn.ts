import { source as AbortSource } from 'abortable-iterator'
import { CLOSE_TIMEOUT } from './constants'
import logger from '../../logger'
import type { AbortOptions } from '@libp2p/interfaces'
import type { MultiaddrConnection } from '@libp2p/interface-connection'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { DuplexWebSocket } from 'it-ws/duplex'

import pTimeout from 'p-timeout'

const log = logger('libp2p:websockets:socket')

export interface SocketToConnOptions extends AbortOptions {
  localAddr?: Multiaddr
}

// Convert a stream into a MultiaddrConnection
// https://github.com/libp2p/interface-transport#multiaddrconnection
export function socketToMaConn(
  stream: DuplexWebSocket,
  remoteAddr: Multiaddr,
  options?: SocketToConnOptions
): MultiaddrConnection {
  options = options ?? {}

  const maConn: MultiaddrConnection = {
    async sink(source) {
      if (options?.signal != null) {
        source = AbortSource(source, options.signal)
      }

      try {
        await stream.sink(source)
      } catch (err: any) {
        if (err.type !== 'aborted') {
          log.error(err)
        }
      }
    },

    source: options.signal != null ? AbortSource(stream.source, options.signal) : stream.source,

    remoteAddr,

    timeline: { open: Date.now() },

    async close() {
      const start = Date.now()

      try {
        // Possibly libp2p used the wrong pTimeout arguments and this was our problem, but why did they used it? TS off or something.
        await pTimeout(stream.close(), CLOSE_TIMEOUT)
      } catch (err) {
        const { host, port } = maConn.remoteAddr.toOptions()
        log('timeout closing stream to %s:%s after %dms, destroying it manually', host, port, Date.now() - start)

        stream.destroy()
      } finally {
        maConn.timeline.close = Date.now()
      }
    },
  }

  stream.socket.addEventListener(
    'close',
    () => {
      // In instances where `close` was not explicitly called,
      // such as an iterable stream ending, ensure we have set the close
      // timeline
      if (maConn.timeline.close == null) {
        maConn.timeline.close = Date.now()
      }
    },
    { once: true }
  )

  return maConn
}
