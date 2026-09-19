import net from 'net'
import { startUnavailableQss } from './unavailableQss'

describe('unavailable QSS fixture', () => {
  it('rejects repeated connections while reserving its endpoint, then releases it', async () => {
    const fixture = await startUnavailableQss()
    const port = Number(new URL(fixture.endpoint).port)
    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        await new Promise<void>((resolve, reject) => {
          const socket = net.connect(port, '127.0.0.1')
          socket.setTimeout(1000, () => {
            socket.destroy()
            reject(new Error('Fixture left the connection open'))
          })
          socket.on('error', error => {
            if ((error as NodeJS.ErrnoException).code !== 'ECONNRESET') reject(error)
          })
          socket.once('close', () => resolve())
        })
        expect(fixture.connectionCount).toBe(attempt)
      }
      const contender = net.createServer()
      await expect(
        new Promise<void>((resolve, reject) => {
          contender.once('error', reject)
          contender.listen(port, '127.0.0.1', () => {
            contender.close()
            resolve()
          })
        })
      ).rejects.toMatchObject({ code: 'EADDRINUSE' })
    } finally {
      await fixture.close()
    }
    const replacement = net.createServer()
    await new Promise<void>((resolve, reject) => {
      replacement.once('error', reject)
      replacement.listen(port, '127.0.0.1', resolve)
    })
    await new Promise<void>(resolve => replacement.close(() => resolve()))
  })
})
