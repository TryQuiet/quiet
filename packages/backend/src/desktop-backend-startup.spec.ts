import { jest } from '@jest/globals'
import { EventEmitter, once } from 'events'
import net from 'net'
import { startDesktopBackend } from './desktop-backend-startup'

describe('Desktop close requests during backend startup', () => {
  const logger = { info: jest.fn(), error: jest.fn() }

  it.each(['during startup', 'after startup'])(
    'closes the initialized server exactly once when quit arrives %s',
    async timing => {
      const messages = new EventEmitter()
      const server = net.createServer(socket => socket.end())
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      let completeStartup!: () => void
      const startup = new Promise<void>(resolve => {
        completeStartup = resolve
      })
      let closes = 0
      const closed = once(server, 'close')
      try {
        const started = startDesktopBackend(
          async () => {
            await startup
            return {
              value: server,
              close: async () => {
                closes += 1
                await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())))
              },
            }
          },
          logger,
          messages
        )

        // Secret delivery and unrelated IPC must not be interpreted as quit.
        messages.emit('message', { type: 'set-socket-secret' })
        if (timing === 'after startup') {
          completeStartup()
          expect(await started).toBe(server)
        }
        messages.emit('message', 'close')
        messages.emit('message', 'close')
        if (timing === 'during startup') {
          await new Promise(resolve => setImmediate(resolve))
          expect(server.listening).toBe(true)
          expect(closes).toBe(0)
          completeStartup()
        }
        await started
        await closed
        expect(server.listening).toBe(false)
        expect(closes).toBe(1)
        messages.emit('message', 'close')
        await new Promise(resolve => setImmediate(resolve))
        expect(closes).toBe(1)
      } finally {
        if (server.listening) server.close()
      }
    }
  )

  it('removes the close listener if initialization fails', async () => {
    const messages = new EventEmitter()
    await expect(
      startDesktopBackend(
        async () => {
          messages.emit('message', 'close')
          throw new Error('Backend initialization failed')
        },
        logger,
        messages
      )
    ).rejects.toThrow('Backend initialization failed')
    expect(messages.listenerCount('message')).toBe(0)
  })
})
