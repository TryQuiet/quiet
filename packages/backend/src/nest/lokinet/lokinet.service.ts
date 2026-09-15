import * as childProcess from 'child_process'
import * as fs from 'fs'
import { EventEmitter } from 'events'
import { Resolver } from 'dns'
import { promisify } from 'util'
import { SocketEvents } from '@quiet/types'
import { LOKINET_DNS, LOKINET_LISTEN_HOST, LOKINET_WS_PORT } from '@quiet/common'

export interface LokinetOptions {
  quietDir: string
  bin?: string
  apiUrl?: string
  socksHost?: string
  socksPort?: number
  dnsServer?: string
  emit?: (event: string, ...args: unknown[]) => void
}

/**
 * Talk to an already-running system lokinet.
 * Health and SNApp identity come from the Lokinet stub resolver (127.3.2.1),
 * not OxenMQ on :1190 (often disabled) and not HTTP.
 * Never spawn a second lokinet process.
 */
export class LokinetService extends EventEmitter {
  socksPort: number
  process: childProcess.ChildProcess | null = null
  bootstrapped = false
  address: string | undefined
  private readonly dnsServer: string
  private readonly quietDir: string
  private snapps = new Map<string, { targetPort: number; keyfile?: string }>()

  constructor(private readonly opts: LokinetOptions) {
    super()
    this.quietDir = opts.quietDir
    this.dnsServer = opts.dnsServer || LOKINET_DNS
    this.socksPort = opts.socksPort ?? 0
  }

  async init(): Promise<void> {
    fs.mkdirSync(this.quietDir, { recursive: true })
    this.address = await this.lookupLocalSnapp()
    this.bootstrapped = true
    this.emit('bootstrapped')
    this.opts.emit?.(SocketEvents.TOR_INITIALIZED)
  }

  async spawnHiddenService(params: { targetPort: number; privKey?: string }): Promise<string> {
    if (!this.address) this.address = await this.lookupLocalSnapp()
    this.snapps.set(this.address, { targetPort: params.targetPort, keyfile: params.privKey })
    return this.address
  }

  async destroyHiddenService(address: string): Promise<void> {
    this.snapps.delete(address)
  }

  getInitializedHiddenServices(): string[] {
    return [...this.snapps.keys()]
  }

  async onModuleDestroy(): Promise<void> {
    this.process = null
  }

  /** Resolve a .loki name (or bare SNApp) via Lokinet stub DNS to a TUN IP. */
  async resolveHost(host: string): Promise<string> {
    const h = host.trim().toLowerCase()
    const name = h.endsWith('.loki') ? h : `${h}.loki`
    try {
      const resolver = new Resolver()
      resolver.setServers([this.dnsServer])
      const resolve4 = promisify(resolver.resolve4.bind(resolver))
      const addrs = await resolve4(name)
      if (addrs?.[0]) return addrs[0]
    } catch {
      // fall through to `host` CLI
    }
    return new Promise((resolve, reject) => {
      childProcess.exec(`host ${name} ${this.dnsServer}`, { timeout: 8000 }, (err, stdout, stderr) => {
        const text = `${stdout || ''}\n${stderr || ''}`
        const ip = text.match(/\b(172\.\d+\.\d+\.\d+)\b/)
        if (ip) {
          resolve(ip[1])
          return
        }
        reject(new Error(`Lokinet DNS at ${this.dnsServer} did not resolve ${name}` + (err ? `: ${err.message}` : `\n${text}`)))
      })
    })
  }

  getListenHost(): string {
    return LOKINET_LISTEN_HOST
  }

  getListenPort(): number {
    return LOKINET_WS_PORT
  }

  private lookupLocalSnapp(): Promise<string> {
    return new Promise((resolve, reject) => {
      childProcess.exec(
        `host localhost.loki ${this.dnsServer}`,
        { timeout: 8000 },
        (err, stdout, stderr) => {
          const text = `${stdout || ''}\n${stderr || ''}`
          const match = text.match(/([a-z0-9]{20,})\.loki/i)
          if (match) {
            resolve(match[0].toLowerCase())
            return
          }
          reject(
            new Error(
              `Lokinet DNS at ${this.dnsServer} did not return localhost.loki` +
                (err ? `: ${err.message}` : `\n${text}`)
            )
          )
        }
      )
    })
  }
}
