import { EventEmitter } from 'events'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
  CONFIG_OPTIONS,
  QUIET_DIR,
  SERVER_IO_PROVIDER,
  TOR_PARAMS_PROVIDER,
  TOR_PASSWORD_PROVIDER,
} from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { Tor as TorDaemon } from './tor.service'
import { TorControl } from './tor-control.service'
import { TorParamsProvider, TorPasswordProvider } from './tor.types'
import { LokinetService } from '../lokinet/lokinet.service'
import { createLogger } from '../common/logger'
import { overlayFromUrl } from '@quiet/common'

const logger = createLogger('DualOverlay')

function stripTld(address: string): string {
  return address.replace(/\.loki$/i, '').replace(/\.onion$/i, '')
}

@Injectable()
export class Tor extends EventEmitter implements OnModuleInit {
  socksPort: number
  bootstrapped = false
  private readonly tor: TorDaemon
  private readonly lokinet: LokinetService
  private lokiAddress: string | undefined
  [key: string]: any

  constructor(
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(TOR_PARAMS_PROVIDER) public readonly torParamsProvider: TorParamsProvider,
    @Inject(TOR_PASSWORD_PROVIDER) public readonly torPasswordProvider: TorPasswordProvider,
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    torControl: TorControl
  ) {
    super()
    this.tor = new TorDaemon(
      configOptions,
      quietDir,
      torParamsProvider,
      torPasswordProvider,
      serverIoProvider,
      torControl
    )
    this.lokinet = new LokinetService({ quietDir })
    this.socksPort = this.tor.socksPort
    this.tor.on('bootstrapped', () => {
      this.bootstrapped = true
      this.emit('bootstrapped')
    })

    const proto = Object.getPrototypeOf(this.tor) as object
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor') continue
      if (name in this) continue
      const desc = Object.getOwnPropertyDescriptor(proto, name)
      if (!desc || typeof desc.value !== 'function') continue
      ;(this as any)[name] = (...args: unknown[]) => (this.tor as any)[name](...args)
    }
  }

  async onModuleInit() {
    await this.tor.onModuleInit()
    this.socksPort = this.tor.socksPort
    try {
      await this.lokinet.init()
      logger.info('Lokinet overlay ready', { loki: this.lokinet.address })
    } catch (e) {
      logger.warn('Lokinet unavailable; .loki dials will fail until it starts', e)
    }
  }

  async onModuleDestroy() {
    await this.lokinet.onModuleDestroy()
    await this.tor.onModuleDestroy()
  }

  async init(timeout?: number) {
    await this.tor.init(timeout)
    this.socksPort = this.tor.socksPort
    try {
      await this.lokinet.init()
    } catch (e) {
      logger.warn('Lokinet init failed', e)
    }
  }

  async kill() {
    return (this.tor as any).kill?.()
  }

  private async lokiOrThrow(targetPort: number, privKey?: string): Promise<string> {
    this.lokiAddress = await this.lokinet.spawnHiddenService({ targetPort, privKey })
    if (!this.lokiAddress) throw new Error('Lokinet did not return a .loki name')
    return this.lokiAddress
  }

  async createNewHiddenService(params: { targetPort: number; virtPort?: number }) {
    const hiddenService = await this.tor.createNewHiddenService(params)
    const loki = await this.lokiOrThrow(params.targetPort)
    const onionAddress = stripTld(loki)
    logger.info('Using Lokinet SNApp as hidden service', { loki, onionAddress })
    return { ...hiddenService, onionAddress }
  }

  async registerHiddenService(data: {
    targetPort: number
    privKey?: string
    onionAddress?: string
    virtPort?: number
  }) {
    try {
      const loki = await this.lokiOrThrow(data.targetPort, data.privKey)
      data = { ...data, onionAddress: stripTld(loki) }
    } catch (e) {
      logger.warn('Lokinet SNApp lookup failed during register', e)
    }
    return (this.tor as any).registerHiddenService(data)
  }

  async spawnHiddenService(params: { targetPort: number; privKey?: string; virtPort?: number; port?: number }) {
    await this.tor.spawnHiddenService(params as any)
    return stripTld(await this.lokiOrThrow(params.targetPort, params.privKey))
  }

  async destroyHiddenService(address: string) {
    if (overlayFromUrl(address) === 'lokinet' || address.includes('loki')) {
      return this.lokinet.destroyHiddenService(address)
    }
    return this.tor.destroyHiddenService(address)
  }

  public getLokiAddress(): string | undefined {
    return this.lokiAddress
  }

  public rewireNativeTor(args: { controlPort: number; httpTunnelPort: number; authCookie: string }) {
    this.tor.rewireNativeTor(args)
  }

  public resetHiddenServices() {
    this.tor.resetHiddenServices()
  }

  public resetBootstrapState() {
    this.tor.resetBootstrapState()
    this.bootstrapped = false
  }

  public startBootstrapWatcher(intervalMs?: number) {
    this.tor.startBootstrapWatcher(intervalMs)
  }

  public setControlPort(port: number) {
    this.tor.setControlPort(port)
  }

  public async isBootstrappingFinished(): Promise<boolean> {
    return this.tor.isBootstrappingFinished()
  }
}
