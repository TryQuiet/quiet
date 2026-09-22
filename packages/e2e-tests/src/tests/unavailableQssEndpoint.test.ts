import http from 'http'
import net from 'net'
import { unavailableQssEndpoint } from '../unavailableQssEndpoint'

const request = (url: string) =>
  new Promise<number | undefined>((resolve, reject) => {
    http
      .get(url.replace(/^ws:/, 'http:'), response => {
        response.resume()
        resolve(response.statusCode)
      })
      .on('error', reject)
  })

describe('unavailable QSS endpoint', () => {
  it('rejects real requests while another local service remains available', async () => {
    const existingService = http.createServer((_request, response) => response.end('existing service'))
    await new Promise<void>(resolve => existingService.listen(0, '127.0.0.1', resolve))
    const { port } = existingService.address() as net.AddressInfo
    const endpoint = await unavailableQssEndpoint()
    try {
      expect(endpoint.url).not.toBe(`ws://127.0.0.1:${port}`)
      await expect(request(endpoint.url)).rejects.toMatchObject({ code: 'ECONNRESET' })
      await expect(request(`http://127.0.0.1:${port}`)).resolves.toBe(200)
    } finally {
      await endpoint.close()
      await new Promise<void>(resolve => existingService.close(() => resolve()))
    }
  })

  it('keeps the endpoint reserved until cleanup, then releases its port', async () => {
    const endpoint = await unavailableQssEndpoint()
    const port = Number(new URL(endpoint.url).port)
    const otherServer = net.createServer()
    try {
      const occupied = new Promise(resolve => otherServer.once('error', resolve))
      otherServer.listen(port, '127.0.0.1')
      await expect(occupied).resolves.toMatchObject({ code: 'EADDRINUSE' })
    } finally {
      await endpoint.close()
    }
    await new Promise<void>(resolve => otherServer.listen(port, '127.0.0.1', resolve))
    await new Promise<void>(resolve => otherServer.close(() => resolve()))
  })

  it('isolates simultaneous fixtures from one another', async () => {
    const first = await unavailableQssEndpoint()
    const second = await unavailableQssEndpoint()
    try {
      expect(first.url).not.toBe(second.url)
      await first.close()
      await expect(request(second.url)).rejects.toMatchObject({ code: 'ECONNRESET' })
    } finally {
      await Promise.all([first.close(), second.close()])
    }
  })

  it('counts every connection attempt it rejects', async () => {
    const endpoint = await unavailableQssEndpoint()
    try {
      expect(endpoint.connectionCount).toBe(0)
      await expect(request(endpoint.url)).rejects.toMatchObject({ code: 'ECONNRESET' })
      expect(endpoint.connectionCount).toBe(1)
      await expect(request(endpoint.url)).rejects.toMatchObject({ code: 'ECONNRESET' })
      expect(endpoint.connectionCount).toBe(2)
    } finally {
      await endpoint.close()
    }
  })
})
