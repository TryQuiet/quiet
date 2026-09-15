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
import { LOKINET_WS_PORT } from '@quiet/common'

const logger = createLogger('LokinetOverlay')

function stripTld(address: string): string {
  return address.replace(/\.loki$/i, '').replace(/\.onion$/i, '')
}

/**
 * Loki-only overlay shim.
 * Does not wrap Tor for addresses: SNApp identity comes from system Lokinet DNS.
 * Tor daemon is not started; leftover Tor APIs no-op or throw clearly.
 */
@Injectable()
export class Tor extends EventEmitter implements OnModuleInit {
  socksPort = 0
  bootstrapped = false
  /** Retained for Nest token compatibility; never initialized for Day 1 Loki-only. */
  private readonly tor: TorDaemon | null = null
  private readonly lokinet: LokinetService
  private lokiAddress: string | undefined
  [key: string]: any

  constructor(
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(TOR_PARAMS_PROVIDER) public readonly torParamsProvider: TorParamsProvider,
    @Inject(TOR_PASSWORD_PROVIDER) public readonly torPasswordProvider: TorPasswordProvider,
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    _torControl: TorControl
  ) {
    super()
    // Do not construct/start TorDaemon — Quiet Loki must not wrap Tor.
    void _torControl
    void this.tor
    this.lokinet = new LokinetService({ quietDir })
  }

  async onModuleInit() {
    await this.init()
  }

  async onModuleDestroy() {
    await this.lokinet.onModuleDestroy()
  }

  async init(_timeout?: number) {
    try {
      await this.lokinet.init()
      this.lokiAddress = this.lokinet.address
      this.bootstrapped = true
      this.emit('bootstrapped')
      logger.info('Lokinet overlay ready (no Tor)', { loki: this.lokinet.address })
    } catch (e) {
      this.bootstrapped = false
      logger.warn('Lokinet init failed; .loki dials will fail until system lokinet is up', e)
      throw e
    }
  }

  async kill() {
    this.bootstrapped = false
  }

  private async lokiOrThrow(targetPort: number, privKey?: string): Promise<string> {
    this.lokiAddress = await this.lokinet.spawnHiddenService({ targetPort, privKey })
    if (!this.lokiAddress) throw new Error('Lokinet did not return a .loki name')
    return this.lokiAddress
  }

  async createNewHiddenService(params: { targetPort: number; virtPort?: number }) {
    const port = params.targetPort || LOKINET_WS_PORT
    const loki = await this.lokiOrThrow(port)
    const onionAddress = stripTld(loki)
    logger.info('Using Lokinet SNApp as hidden service (no Tor)', { loki, onionAddress, port })
    return { onionAddress, privateKey: '' }
  }

  async registerHiddenService(data: {
    targetPort: number
    privKey?: string
    onionAddress?: string
    virtPort?: number
  }) {
    const loki = await this.lokiOrThrow(data.targetPort || LOKINET_WS_PORT, data.privKey)
    const onionAddress = stripTld(loki)
    logger.info('Registered Lokinet SNApp', { loki, onionAddress })
    return onionAddress
  }

  async spawnHiddenService(params: { targetPort: number; privKey?: string; virtPort?: number; port?: number }) {
    return stripTld(await this.lokiOrThrow(params.targetPort || LOKINET_WS_PORT, params.privKey))
  }

  async destroyHiddenService(address: string) {
    return this.lokinet.destroyHiddenService(address)
  }

  public getLokiAddress(): string | undefined {
    return this.lokiAddress
  }

  public getLokinet(): LokinetService {
    return this.lokinet
  }

  public rewireNativeTor(_args: { controlPort: number; httpTunnelPort: number; authCookie: string }) {
    logger.warn('rewireNativeTor ignored — Quiet Loki does not wrap Tor')
  }

  public resetHiddenServices() {
    // no-op: SNApp is system-owned
  }

  public resetBootstrapState() {
    this.bootstrapped = false
  }

  public startBootstrapWatcher(_intervalMs?: number) {
    // no-op
  }

  public setControlPort(_port: number) {
    // no-op
  }

  public async isBootstrappingFinished(): Promise<boolean> {
    return this.bootstrapped
  }
}
