import { EventEmitter } from 'events'
import { Inject, OnModuleInit } from '@nestjs/common'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER } from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { LokinetService } from '../lokinet/lokinet.service'

export class Tor extends EventEmitter implements OnModuleInit {
  socksPort: number
  bootstrapped = false
  private readonly lokinet: LokinetService

  constructor(
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes
  ) {
    super()
    this.lokinet = new LokinetService({
      quietDir,
      emit: (event, ...args) => this.serverIoProvider.io.emit(event, ...args),
    })
    this.socksPort = this.lokinet.socksPort
    this.lokinet.on('bootstrapped', () => {
      this.bootstrapped = true
      this.emit('bootstrapped')
    })
  }

  async onModuleInit() {
    await this.lokinet.init()
    this.socksPort = this.lokinet.socksPort
  }

  async onModuleDestroy() {
    await this.lokinet.onModuleDestroy()
  }

  async init() {
    await this.lokinet.init()
  }

  async spawnHiddenService(params: { targetPort: number; privKey?: string; virtPort?: number }) {
    return this.lokinet.spawnHiddenService(params)
  }

  async destroyHiddenService(onionAddress: string) {
    return this.lokinet.destroyHiddenService(onionAddress)
  }

  public rewireNativeTor(_args: { controlPort: number; httpTunnelPort: number; authCookie: string }) {
    return
  }

  public resetHiddenServices() {
    return
  }

  public resetBootstrapState() {
    this.bootstrapped = false
  }

  public async isBootstrappingFinished(): Promise<boolean> {
    return this.bootstrapped || this.lokinet.bootstrapped
  }
}
