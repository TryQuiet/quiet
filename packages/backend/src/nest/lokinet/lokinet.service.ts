import * as childProcess from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { EventEmitter } from 'events'
import { SocketEvents } from '@quiet/types'

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
    this.dnsServer = opts.dnsServer || process.env.LOKINET_DNS || '127.3.2.1'
    this.socksPort = opts.socksPort ?? Number(process.env.LOKINET_SOCKS_PORT || 9050)
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
