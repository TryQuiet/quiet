import { jest } from '@jest/globals'

import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { TorControl } from './tor-control.service'
import { Tor } from './tor.service'
import { TorControlAuthType, TorParamsProvider, TorPasswordProvider } from './tor.types'

describe('Tor native session rewiring', () => {
  const controlPort = 19051
  const httpTunnelPort = 18118
  const authCookie = 'cookie-a'
  const privKey = 'ED25519-V3:test-private-key'
  const onionAddress = 'test-service-id'
  const bootstrapDone = '250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"'

  const deferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
      resolve = promiseResolve
      reject = promiseReject
    })
    return { promise, reject, resolve }
  }

  const addOnionResponse = () => ({
    code: 250,
    messages: [`250-ServiceID=${onionAddress}`, '250 OK'],
  })

  const createTorService = () => {
    const configOptions: ConfigOptions = {
      options: {},
      socketIOPort: 0,
      httpTunnelPort,
      torAuthCookie: authCookie,
      torControlPort: controlPort,
      env: {},
    }
    const torControl = new TorControl(
      {
        port: controlPort,
        host: 'localhost',
        auth: {
          type: TorControlAuthType.COOKIE,
          value: authCookie,
        },
      },
      configOptions
    )
    const torParamsProvider: TorParamsProvider = {
      torPath: '',
      options: {
        env: {
          LD_LIBRARY_PATH: undefined,
          HOME: '',
        },
        detached: false,
      },
    }
    const torPasswordProvider: TorPasswordProvider = {
      torPassword: '',
      torHashedPassword: '',
    }
    const serverIoProvider = {
      io: { emit: jest.fn() },
    } as unknown as ServerIoProviderTypes
    const torService = new Tor(configOptions, '', torParamsProvider, torPasswordProvider, serverIoProvider, torControl)

    return { torControl, torService }
  }

  const registerHiddenService = async (torService: Tor, torControl: TorControl) => {
    jest.spyOn(torControl, 'sendCommand').mockResolvedValue(addOnionResponse())
    await torService.spawnHiddenService({ targetPort: 4343, privKey })
  }

  it('preserves bootstrap and initialized hidden services when the native Tor session is unchanged', async () => {
    const { torControl, torService } = createTorService()
    await registerHiddenService(torService, torControl)
    torService.bootstrapped = true
    jest.mocked(torControl.sendCommand).mockClear()

    torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
    await torService.spawnHiddenService({ targetPort: 4343, privKey })

    expect(torService.bootstrapped).toBe(true)
    expect(torControl.sendCommand).not.toHaveBeenCalled()
  })

  it('treats a control port parsed from the mobile CLI as the unchanged native Tor session', async () => {
    const { torControl, torService } = createTorService()
    torControl.torControlParams.port = String(controlPort) as unknown as number
    await registerHiddenService(torService, torControl)
    torService.bootstrapped = true
    const startBootstrapWatcher = jest.spyOn(torService, 'startBootstrapWatcher')
    jest.mocked(torControl.sendCommand).mockClear()

    torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
    await torService.spawnHiddenService({ targetPort: 4343, privKey })

    expect(torService.bootstrapped).toBe(true)
    expect(startBootstrapWatcher).not.toHaveBeenCalled()
    expect(torControl.sendCommand).not.toHaveBeenCalled()
  })

  it('resets bootstrap state and replays hidden services for a new native Tor session', async () => {
    const { torControl, torService } = createTorService()
    await registerHiddenService(torService, torControl)
    torService.bootstrapped = true
    const startBootstrapWatcher = jest.spyOn(torService, 'startBootstrapWatcher').mockImplementation(() => {})
    jest.mocked(torControl.sendCommand).mockClear()

    torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie: 'cookie-b' })
    await torService.spawnHiddenServices()

    expect(torService.bootstrapped).toBe(false)
    expect(startBootstrapWatcher).toHaveBeenCalledTimes(1)
    expect(torControl.sendCommand).toHaveBeenCalledWith(`ADD_ONION ${privKey} Flags=Detach Port=80,127.0.0.1:4343`)
  })

  it('ignores a stale bootstrap status without spawning services or stopping the replacement watcher', async () => {
    jest.useFakeTimers()
    const { torControl, torService } = createTorService()
    await registerHiddenService(torService, torControl)
    const staleStatus = deferred<{ code: number; messages: string[] }>()
    jest
      .mocked(torControl.sendCommand)
      .mockReset()
      .mockImplementation(command => {
        if (command === 'GETINFO status/bootstrap-phase') return staleStatus.promise
        return Promise.resolve(addOnionResponse())
      })

    try {
      torService.startBootstrapWatcher(100)
      await jest.advanceTimersByTimeAsync(100)
      expect(torControl.sendCommand).toHaveBeenCalledWith('GETINFO status/bootstrap-phase')

      torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie: 'cookie-b' })
      const replacementWatcher = torService.interval
      staleStatus.resolve({ code: 250, messages: [bootstrapDone, '250 OK'] })
      await jest.advanceTimersByTimeAsync(0)

      expect(torService.bootstrapped).toBe(false)
      expect(torService.interval).toBe(replacementWatcher)
      expect(torControl.sendCommand).toHaveBeenCalledTimes(1)
    } finally {
      torService.resetBootstrapState()
      jest.useRealTimers()
    }
  })

  it('does not let a replaced watcher stop its same-generation successor', async () => {
    jest.useFakeTimers()
    const { torControl, torService } = createTorService()
    await registerHiddenService(torService, torControl)
    const staleStatus = deferred<{ code: number; messages: string[] }>()
    jest.mocked(torControl.sendCommand).mockReset().mockReturnValue(staleStatus.promise)

    try {
      torService.startBootstrapWatcher(100)
      await jest.advanceTimersByTimeAsync(100)

      torService.startBootstrapWatcher(2500)
      const replacementWatcher = torService.interval
      staleStatus.resolve({ code: 250, messages: [bootstrapDone, '250 OK'] })
      await jest.advanceTimersByTimeAsync(0)

      expect(torService.bootstrapped).toBe(false)
      expect(torService.interval).toBe(replacementWatcher)
    } finally {
      torService.resetBootstrapState()
      jest.useRealTimers()
    }
  })

  it('does not let stale mark work populate state or stop a new-generation watcher', async () => {
    jest.useFakeTimers()
    const { torControl, torService } = createTorService()
    await registerHiddenService(torService, torControl)
    torService.resetBootstrapState()
    const staleInitialization = deferred<{ code: number; messages: string[] }>()
    const sendCommand = jest
      .mocked(torControl.sendCommand)
      .mockReset()
      .mockImplementation(command => {
        if (command === 'GETINFO status/bootstrap-phase') {
          return Promise.resolve({ code: 250, messages: [bootstrapDone, '250 OK'] })
        }
        return staleInitialization.promise
      })

    try {
      torService.startBootstrapWatcher(100)
      await jest.advanceTimersByTimeAsync(100)
      expect(sendCommand).toHaveBeenCalledTimes(2)

      torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie: 'cookie-b' })
      const replacementWatcher = torService.interval
      staleInitialization.resolve(addOnionResponse())
      await jest.advanceTimersByTimeAsync(0)

      expect(torService.bootstrapped).toBe(false)
      expect(torService.interval).toBe(replacementWatcher)

      sendCommand.mockResolvedValue(addOnionResponse())
      await torService.spawnHiddenService({ targetPort: 4343, privKey })
      expect(sendCommand).toHaveBeenCalledTimes(3)
    } finally {
      torService.resetBootstrapState()
      jest.useRealTimers()
    }
  })

  it('rechecks the bootstrap generation after spawning hidden services', async () => {
    const { torControl, torService } = createTorService()
    jest.spyOn(torControl, 'sendCommand').mockResolvedValue({ code: 250, messages: [bootstrapDone, '250 OK'] })
    jest.spyOn(torService, 'startBootstrapWatcher').mockImplementation(() => {})
    jest.spyOn(torService, 'spawnHiddenServices').mockImplementation(async () => {
      torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie: 'cookie-b' })
    })

    await expect(torService.isBootstrappingFinished()).resolves.toBe(false)

    expect(torService.bootstrapped).toBe(false)
  })

  it('preserves native Tor state when kill has no managed process to terminate', async () => {
    const { torControl, torService } = createTorService()
    await registerHiddenService(torService, torControl)
    torService.bootstrapped = true
    jest.mocked(torControl.sendCommand).mockClear()

    await torService.kill()
    torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie })
    await torService.spawnHiddenService({ targetPort: 4343, privKey })

    expect(torService.bootstrapped).toBe(true)
    expect(torControl.sendCommand).not.toHaveBeenCalled()
  })

  it('deduplicates concurrent hidden-service initialization by private key', async () => {
    const { torControl, torService } = createTorService()
    const initialization = deferred<{ code: number; messages: string[] }>()
    const sendCommand = jest.spyOn(torControl, 'sendCommand').mockReturnValue(initialization.promise)

    const first = torService.spawnHiddenService({ targetPort: 4343, privKey })
    const second = torService.spawnHiddenService({ targetPort: 4343, privKey })

    expect(sendCommand).toHaveBeenCalledTimes(1)
    initialization.resolve(addOnionResponse())
    await expect(Promise.all([first, second])).resolves.toEqual([`${onionAddress}.onion`, `${onionAddress}.onion`])
  })

  it('does not let stale hidden-service initialization populate a new Tor generation', async () => {
    const { torControl, torService } = createTorService()
    const staleInitialization = deferred<{ code: number; messages: string[] }>()
    const sendCommand = jest.spyOn(torControl, 'sendCommand').mockReturnValue(staleInitialization.promise)
    const startBootstrapWatcher = jest.spyOn(torService, 'startBootstrapWatcher').mockImplementation(() => {})

    const staleResult = torService.spawnHiddenService({ targetPort: 4343, privKey })
    torService.rewireNativeTor({ controlPort, httpTunnelPort, authCookie: 'cookie-b' })
    staleInitialization.resolve(addOnionResponse())
    await expect(staleResult).rejects.toThrow('Tor generation changed while initializing hidden service')

    sendCommand.mockResolvedValue(addOnionResponse())
    await torService.spawnHiddenService({ targetPort: 4343, privKey })

    expect(startBootstrapWatcher).toHaveBeenCalledTimes(1)
    expect(sendCommand).toHaveBeenCalledTimes(2)
  })
})
