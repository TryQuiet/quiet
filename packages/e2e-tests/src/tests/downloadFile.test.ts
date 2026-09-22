import fs from 'fs'
import os from 'os'
import path from 'path'
import { Worker } from 'worker_threads'
import { downloadFile } from '../downloadFile'

describe('installer HTTP downloads', () => {
  let server: Worker
  let baseUrl: string
  let directory: string
  let destination: string
  const installerBytes = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0, 1, 2, 3])

  beforeAll(async () => {
    // The real curl process is synchronous, so serve its requests on another thread.
    server = new Worker(
      `
        const http = require('http')
        const { parentPort, workerData } = require('worker_threads')
        const server = http.createServer((request, response) => {
          if (request.url === '/redirect') {
            response.writeHead(302, { Location: '/installer' })
            response.end()
          } else if (request.url === '/installer') {
            response.writeHead(200, { 'Content-Type': 'application/octet-stream' })
            response.end(Buffer.from(workerData))
          } else {
            response.writeHead(request.url === '/unavailable' ? 503 : 404)
            response.end('Not Found')
          }
        })
        server.listen(0, '127.0.0.1', () => parentPort.postMessage(server.address().port))
      `,
      { eval: true, workerData: installerBytes }
    )
    const port = await new Promise<number>((resolve, reject) => {
      server.once('message', resolve)
      server.once('error', reject)
    })
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    await server?.terminate()
  })

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-installer-download-'))
    destination = path.join(directory, "Quiet release's installer.AppImage")
  })

  afterEach(() => {
    if (fs.existsSync(destination)) fs.unlinkSync(destination)
    fs.rmdirSync(directory)
  })

  it.each(['/installer', '/redirect'])('downloads the installer bytes from %s', endpoint => {
    downloadFile(`${baseUrl}${endpoint}`, destination)
    expect(fs.readFileSync(destination)).toEqual(installerBytes)
  })

  it.each(['/missing', '/unavailable'])('rejects HTTP errors from %s without saving an error page', endpoint => {
    expect(() => downloadFile(`${baseUrl}${endpoint}`, destination)).toThrow()
    expect(fs.existsSync(destination)).toBe(false)
  })
})
