import { jest } from '@jest/globals'
import { Global, Module } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'

import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { SocketService } from '../socket/socket.service'
import { ConfigOptions } from '../types'
import { TorControl } from './tor-control.service'
import { TorModule } from './tor.module'
import { Tor } from './tor.service'
import { TorControlAuthType } from './tor.types'

describe('TorModule authentication initialization', () => {
  const controlPort = 19051
  const httpTunnelPort = 18118
  const authCookie = 'a'.repeat(64)
  let module: TestingModule | undefined
  let previousBackend: string | undefined

  const createModuleBuilder = (config: Partial<ConfigOptions> = {}) => {
    const configOptions: ConfigOptions = {
      options: {},
      env: {},
      socketIOPort: 0,
      torControlPort: controlPort,
      httpTunnelPort,
      ...config,
    }

    @Global()
    @Module({
      providers: [
        { provide: CONFIG_OPTIONS, useValue: configOptions },
        { provide: QUIET_DIR, useValue: '' },
        { provide: SERVER_IO_PROVIDER, useValue: { io: { emit: jest.fn() } } },
      ],
      exports: [CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER],
    })
    class TorTestDependenciesModule {}

    return Test.createTestingModule({ imports: [TorTestDependenciesModule, TorModule] })
      .overrideProvider(SocketService)
      .useValue({})
  }

  beforeEach(() => {
    module = undefined
    previousBackend = process.env.BACKEND
    process.env.BACKEND = 'mobile'
  })

  afterEach(async () => {
    await module?.close()
    jest.useRealTimers()
    if (previousBackend === undefined) {
      delete process.env.BACKEND
    } else {
      process.env.BACKEND = previousBackend
    }
  })

  it.each([null, undefined])(
    'initializes with a pending native cookie (%s), then bootstraps after rewiring',
    async cookie => {
      // Keep the real Tor providers: native startup returns a null password provider.
      // backendManager passes null at runtime even though ConfigOptions only declares undefined.
      module = await createModuleBuilder({ torAuthCookie: cookie as string | undefined }).compile()
      const tor = module.get(Tor)
      const torControl = module.get(TorControl)
      const sendCommand = jest.spyOn(torControl, 'sendCommand').mockResolvedValue({
        code: 250,
        messages: ['250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"'],
      })
      expect(module.get(TOR_PASSWORD_PROVIDER)).toBeNull()
      expect(torControl.torControlParams.auth).toEqual({ type: TorControlAuthType.COOKIE, value: '' })

      jest.useFakeTimers()
      await module.init()
      await jest.advanceTimersByTimeAsync(5000)
      expect(sendCommand).not.toHaveBeenCalled()
      expect(tor.bootstrapped).toBe(false)

      tor.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
      expect(torControl.torControlParams.auth).toEqual({ type: TorControlAuthType.COOKIE, value: authCookie })
      await jest.advanceTimersByTimeAsync(2500)
      expect(sendCommand).toHaveBeenCalledTimes(1)
      expect(tor.bootstrapped).toBe(true)
    }
  )

  it('uses an existing native cookie without a password provider', async () => {
    module = await createModuleBuilder({ torAuthCookie: authCookie }).compile()
    expect(module.get(TOR_PASSWORD_PROVIDER)).toBeNull()
    expect(module.get(TorControl).torControlParams.auth).toEqual({
      type: TorControlAuthType.COOKIE,
      value: authCookie,
    })
  })

  it('keeps community hidden-service creation pending until first native readiness establishes its generation', async () => {
    module = await createModuleBuilder().compile()
    const tor = module.get(Tor)
    const torControl = module.get(TorControl)
    const connect = jest.spyOn(torControl as any, '_connect').mockResolvedValue(undefined)
    const sendCommand = jest.spyOn(torControl, '_sendCommand').mockResolvedValue({
      code: 250,
      messages: ['250-ServiceID=created-service', '250-PrivateKey=ED25519-V3:test-key', '250 OK'],
    })
    jest.useFakeTimers()
    const creation = tor.createNewHiddenService({ targetPort: 3000 })
    await jest.advanceTimersByTimeAsync(5000)
    expect(connect).not.toHaveBeenCalled()
    expect(sendCommand).not.toHaveBeenCalled()

    tor.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
    await expect(creation).resolves.toEqual({
      onionAddress: 'created-service.onion',
      privateKey: 'ED25519-V3:test-key',
    })
    expect(sendCommand).toHaveBeenCalledTimes(1)
  })

  it('publishes an existing hidden service queued before native credentials without a stale-generation failure', async () => {
    module = await createModuleBuilder().compile()
    const tor = module.get(Tor)
    const torControl = module.get(TorControl)
    const connect = jest.spyOn(torControl as any, '_connect').mockResolvedValue(undefined)
    const sendCommand = jest.spyOn(torControl, '_sendCommand').mockResolvedValue({
      code: 250,
      messages: ['250-ServiceID=existing-service', '250 OK'],
    })
    jest.useFakeTimers()
    const publication = tor.spawnHiddenService({
      targetPort: 3000,
      privKey: 'test-key',
      onionAddress: 'existing-service',
    })
    await jest.advanceTimersByTimeAsync(5000)
    expect(connect).not.toHaveBeenCalled()
    expect(sendCommand).not.toHaveBeenCalled()
    expect(() => tor.rewireNativeTor({ controlPort, httpTunnelPort, authCookie: '' })).toThrow('Missing native Tor')
    expect(torControl.hasCredentials).toBe(false)

    tor.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
    await expect(publication).resolves.toBe('existing-service.onion')
    expect(sendCommand).toHaveBeenCalledTimes(1)
  })

  it('still rejects stale community creation if its generation was reset while waiting for the first cookie', async () => {
    module = await createModuleBuilder().compile()
    const tor = module.get(Tor)
    const torControl = module.get(TorControl)
    jest.spyOn(torControl as any, '_connect').mockResolvedValue(undefined)
    jest.spyOn(torControl, '_sendCommand').mockResolvedValue({
      code: 250,
      messages: ['250-ServiceID=stale-service', '250-PrivateKey=ED25519-V3:stale-key', '250 OK'],
    })
    jest.useFakeTimers()
    const creation = tor.createNewHiddenService({ targetPort: 3000 })
    const failure = expect(creation).rejects.toThrow('Tor generation changed while creating hidden service')
    tor.resetBootstrapState()
    tor.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
    await failure
  })

  it('preserves password authentication for backend-managed Tor', async () => {
    process.env.BACKEND = 'desktop'
    module = await createModuleBuilder({ torBinaryPath: '/test/tor' })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: 'test-password', torHashedPassword: 'test-hash' })
      .compile()
    expect(module.get(TorControl).torControlParams.auth).toEqual({
      type: TorControlAuthType.PASSWORD,
      value: 'test-password',
    })
  })
})
