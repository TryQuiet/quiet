import * as childProcess from 'child_process'
import * as fs from 'fs'
import * as http from 'http'
import * as path from 'path'
import { EventEmitter } from 'events'
import { SocketEvents } from '@quiet/types'

export interface LokinetOptions {
  quietDir: string
  bin?: string
  apiUrl?: string
  socksHost?: string
  socksPort?: number
  emit?: (event: string, ...args: unknown[]) => void
}

export class LokinetService extends EventEmitter {
  socksPort: number
  process: childProcess.ChildProcessWithoutNullStreams | null = null
  bootstrapped = false
  private readonly apiUrl: string
  private readonly bin: string
  private readonly quietDir: string
  private snapps = new Map<string, { targetPort: number; keyfile?: string }>()

  constructor(private readonly opts: LokinetOptions) {
    super()
    this.quietDir = opts.quietDir
    this.bin = opts.bin || process.env.LOKINET_BIN || 'lokinet'
    this.apiUrl = opts.apiUrl || process.env.LOKINET_API || 'http://127.0.0.1:1190'
    this.socksPort = opts.socksPort ?? Number(process.env.LOKINET_SOCKS_PORT || 9050)
  }

  async init(): Promise<void> {
    fs.mkdirSync(this.quietDir, { recursive: true })
    const ini = path.join(this.quietDir, 'lokinet.ini')
    if (!fs.existsSync(ini)) {
      fs.writeFileSync(ini, this.defaultIni())
    }
    await this.ensureDaemon(ini)
    await this.waitUntilReady()
    this.bootstrapped = true
    this.emit('bootstrapped')
    this.opts.emit?.(SocketEvents.TOR_INITIALIZED)
  }

  async spawnHiddenService(params: { targetPort: number; privKey?: string }): Promise<string> {
    const keyfile = path.join(this.quietDir, `snapp-${params.targetPort}.private`)
    if (params.privKey && !fs.existsSync(keyfile)) {
      fs.writeFileSync(keyfile, params.privKey)
    }
    const address = await this.lookupLocalSnapp()
    this.snapps.set(address, { targetPort: params.targetPort, keyfile })
    return address
  }

  async destroyHiddenService(address: string): Promise<void> {
    this.snapps.delete(address)
  }

  getInitializedHiddenServices(): string[] {
    return [...this.snapps.keys()]
  }

  async onModuleDestroy(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
    }
  }

  private defaultIni(): string {
    return [
      '[router]',
      'nickname=quiet-lokinet',
      '',
      '[api]',
      'enabled=true',
      'bind=127.0.0.1:1190',
      '',
      '[dns]',
      'upstream=1.1.1.1',
      '',
      '[network]',
      '',
    ].join('\n')
  }

  private async ensureDaemon(ini: string): Promise<void> {
    if (await this.pingApi()) return
    this.process = childProcess.spawn(this.bin, ['-c', ini], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.process.stdout?.on('data', chunk => this.emit('log', String(chunk)))
    this.process.stderr?.on('data', chunk => this.emit('log', String(chunk)))
    this.process.on('exit', code => {
      this.bootstrapped = false
      this.emit('exit', code)
    })
  }

  private async waitUntilReady(timeoutMs = 60_000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      if (await this.pingApi()) return
      await new Promise(r => setTimeout(r, 500))
    }
    throw new Error(`Lokinet API at ${this.apiUrl} did not become ready`)
  }

  private pingApi(): Promise<boolean> {
    return new Promise(resolve => {
      const req = http.get(this.apiUrl, res => {
        res.resume()
        resolve((res.statusCode ?? 500) < 500)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(1000, () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  private lookupLocalSnapp(): Promise<string> {
    return new Promise((resolve, reject) => {
      childProcess.exec(
        'nslookup -type=cname localhost.loki 127.0.0.1',
        { timeout: 8000 },
        (err, stdout) => {
          const match = stdout?.match(/([a-z0-9]+)\.loki/i)
          if (match) {
            resolve(match[0].toLowerCase())
            return
          }
          if (err) {
            reject(new Error(`Could not resolve localhost.loki: ${err.message}`))
            return
          }
          reject(new Error(`nslookup did not return a .loki name:\n${stdout}`))
        }
      )
    })
  }
}
