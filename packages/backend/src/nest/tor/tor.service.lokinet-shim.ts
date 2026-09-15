import { EventEmitter } from 'events'
import { Inject, OnModuleInit } from '@nestjs/common'
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

/**
 * Runs Tor and Lokinet together. Hidden-service / invitation helpers still
 * speak the original `Tor` API. Dial path selection is by hostname suffix:
 * `.onion` → Tor, `.loki` → Lokinet.
 */
export class Tor extends EventEmitter implements OnModuleInit {
  socksPort: number
  bootstrapped = false
  private readonly tor: TorDaemon
  private readonly lokinet: LokinetService
  private lokiAddress: string | undefined

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
  }

  async onModuleInit() {
    await this.tor.onModuleInit()
    this.socksPort = this.tor.socksPort
    try {
      await this.lokinet.init()
      logger.info('Lokinet overlay ready')
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

  async spawnHiddenService(params: { targetPort: number; privKey?: string; virtPort?: number; port?: number }) {
    const onion = await (this.tor as any).spawnHiddenService(params)
    try {
      this.lokiAddress = await this.lokinet.spawnHiddenService({
        targetPort: params.targetPort,
        privKey: params.privKey,
      })
      logger.info('Published dual hidden services', { onion, loki: this.lokiAddress })
    } catch (e) {
      logger.warn('Could not publish .loki SNApp; onion-only mode', e)
    }
    return onion
  }

  async destroyHiddenService(address: string) {
    if (overlayFromUrl(address) === 'lokinet') {
      return this.lokinet.destroyHiddenService(address)
    }
    return (this.tor as any).destroyHiddenService(address)
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
