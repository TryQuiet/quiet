import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { defaultConfigForTest, TestModule } from '../common/test.module'
import { createTmpDir, tmpQuietDirPath } from '../common/utils'
import { removeFilesFromDir, torBinForPlatform, torDirForPlatform } from '../common/utils'
import { QUIET_DIR, TOR_CONTROL_PARAMS, TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { TorModule } from './tor.module'
import { Tor } from './tor.service'
import { type DirResult } from 'tmp'
import { TorControlAuthType } from './tor.types'
import { TorControl } from './tor-control.service'
import { sleep } from '../common/sleep'

// The first test that bootstraps pays for a cold consensus fetch; the rest reuse
// the shared Tor data directory and finish in seconds. That cold fetch has been
// observed past 200s on hosted runners, so the suite budget has to clear it.
jest.setTimeout(300_000)
const BOOTSTRAP_TIMEOUT_MS = 240_000

describe('TorControl', () => {
  let module: TestingModule
  let torService: Tor
  let torControl: TorControl
  let tmpDir: DirResult
  let tmpAppDataPath: string
  let spacedTmpDir: DirResult
  let spacedTmpAppDataPath: string

  // Bounded so a stalled bootstrap reports itself rather than surfacing as a bare
  // jest per-test timeout pointing at whichever test happened to bootstrap first.
  const waitForBootstrap = async (timeoutMs = BOOTSTRAP_TIMEOUT_MS) => {
    if (torService.bootstrapped) return
    let onBootstrapped: (() => void) | undefined
    let timer: NodeJS.Timeout | undefined
    try {
      await new Promise<void>((resolve, reject) => {
        onBootstrapped = resolve
        torService.once('bootstrapped', resolve)
        timer = setTimeout(() => reject(new Error(`Tor did not bootstrap within ${timeoutMs}ms`)), timeoutMs)
      })
    } finally {
      if (timer != null) clearTimeout(timer)
      if (onBootstrapped != null) torService.off('bootstrapped', onBootstrapped)
    }
  }

  const torPassword = 'b5e447c10b0d99e7871636ee5e0839b5'
  const torHashedPassword = '16:FCFFE21F3D9138906021FAADD9E49703CC41848A95F829E0F6E1BDBE63'

  beforeAll(() => {
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    spacedTmpDir = createTmpDir('quietTest Tmp_')
    spacedTmpAppDataPath = tmpQuietDirPath(spacedTmpDir.name)
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleAppDataPath = expect.getState().currentTestName?.endsWith('if Quiet path includes space')
      ? spacedTmpAppDataPath
      : tmpAppDataPath
    module = await Test.createTestingModule({
      imports: [TestModule, TorModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword, torHashedPassword })
      .overrideProvider(TOR_PARAMS_PROVIDER)
      .useValue({
        torPath: torBinForPlatform(),
        options: {
          env: {
            LD_LIBRARY_PATH: torDirForPlatform(),
            HOME: moduleAppDataPath,
          },
          detached: true,
        },
      })
      .overrideProvider(TOR_CONTROL_PARAMS)
      .useValue({
        port: defaultConfigForTest.torControlPort,
        host: 'localhost',
        auth: {
          value: torPassword,
          type: TorControlAuthType.PASSWORD,
        },
      })
      .overrideProvider(QUIET_DIR)
      .useValue(moduleAppDataPath)
      .compile()

    torService = await module.resolve(Tor)
    torControl = await module.resolve(TorControl)
    torControl.authString = 'AUTHENTICATE ' + torPassword + '\r\n'
  })

  afterEach(async () => {
    await torService.kill()
    torService.clearHangingTorProcess()
    await module.close()
  })

  afterAll(() => {
    removeFilesFromDir(tmpAppDataPath)
    removeFilesFromDir(spacedTmpAppDataPath)
    tmpDir.removeCallback()
    spacedTmpDir.removeCallback()
  })

  it('Init tor', async () => {
    expect(torService).toBeDefined()
    await torService.init()
  })

  // it('should detect and kill old tor process before new tor is spawned', async () => {
  //   const torPath = torBinForPlatform()
  //   const httpTunnelPort = await getPort()
  //   const libPath = torDirForPlatform()
  //   const tor = new Tor({
  //     appDataPath: tmpAppDataPath,
  //     torPath,
  //     httpTunnelPort,
  //     options: {
  //       env: {
  //         LD_LIBRARY_PATH: libPath,
  //         HOME: tmpAppDataPath,
  //       },
  //       detached: true,
  //     },
  //   })

  //   await tor.init()

  //   const torSecondInstance = new Tor({
  //     appDataPath: tmpAppDataPath,
  //     torPath,
  //     httpTunnelPort,
  //     options: {
  //       env: {
  //         LD_LIBRARY_PATH: libPath,
  //         HOME: tmpAppDataPath,
  //       },
  //       detached: true,
  //     },
  //   })
  //   await torSecondInstance.init({})
  //   await torSecondInstance.kill()
  // })

  it('spawns new hidden service', async () => {
    await torService.init()
    await waitForBootstrap()
    const hiddenService = await torService.createNewHiddenService({ targetPort: 4343 })
    expect(hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
  })

  it('spawns hidden service using private key', async () => {
    await torService.init()
    await waitForBootstrap()
    const hiddenServiceOnionAddress = await torService.spawnHiddenService({
      targetPort: 4343,
      onionAddress: 'u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad.onion',
      privKey: 'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ==',
    })
    expect(hiddenServiceOnionAddress).toBe('u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad.onion')
  })

  it('creates and destroys hidden service', async () => {
    await torService.init()
    await waitForBootstrap()
    const hiddenService = await torService.createNewHiddenService({ targetPort: 4343 })
    const serviceId = hiddenService.onionAddress.split('.')[0]
    const status = await torService.destroyHiddenService(serviceId)
    expect(status).toBe(true)
  })

  it('tor spawn repeats', async () => {
    const spyOnInit = jest.spyOn(torService, 'init')
    await torService.init(1000)
    await sleep(4000)
    expect(spyOnInit).toHaveBeenCalledTimes(2)
  })

  // The status Tor reports while it retries a relay that timed out. RECOMMENDATION=ignore
  // is Tor saying it expects to recover; #3564 restarted Tor on these every ~35s, and each
  // restart threw away the progress made so far, so a slow link never finished bootstrapping.
  const ignorableTimeoutStatus = (progress: number, tag: string) =>
    `250-status/bootstrap-phase=WARN BOOTSTRAP PROGRESS=${progress} TAG=${tag} SUMMARY="Connecting to a relay" WARNING="Operation timed out" REASON=TIMEOUT COUNT=3 RECOMMENDATION=ignore HOSTADDR="204.8.96.160:443"`
  const bootstrapDoneStatus = '250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done"'

  const withStalledBootstrap = async (
    statusForTick: () => string,
    run: (spies: { initSpy: jest.SpiedFunction<typeof torService.init> }) => Promise<void>
  ) => {
    jest.useFakeTimers()
    const sendCommandSpy = jest.spyOn(torControl, 'sendCommand').mockImplementation(async () => ({
      code: 250,
      messages: [statusForTick(), '250 OK'],
    }))
    const initSpy = jest.spyOn(torService, 'init').mockResolvedValue(undefined)
    const getTorProcessIdsSpy = jest.spyOn(torService, 'getTorProcessIds').mockReturnValue(['123'])
    const torServiceInternals = torService as any

    try {
      torServiceInternals.torDataDirectory = `${tmpAppDataPath}/TorDataDirectory`
      torService.startBootstrapWatcher(1000)
      await run({ initSpy })
    } finally {
      torServiceInternals.stopBootstrapWatcher()
      jest.useRealTimers()
      sendCommandSpy.mockRestore()
      initSpy.mockRestore()
      getTorProcessIdsSpy.mockRestore()
    }
  }

  it('leaves Tor alone while it reports warnings it recommends ignoring', async () => {
    await withStalledBootstrap(
      () => ignorableTimeoutStatus(5, 'conn'),
      async ({ initSpy }) => {
        // Far past the old 30s threshold, and past the ~35s restart loop seen in #3562.
        await jest.advanceTimersByTimeAsync(5 * 60_000)
        expect(initSpy).not.toHaveBeenCalled()
      }
    )
  })

  it('leaves Tor alone while bootstrap keeps advancing, however slowly', async () => {
    let progress = 5
    await withStalledBootstrap(
      () => ignorableTimeoutStatus(progress, 'conn'),
      async ({ initSpy }) => {
        // One percent every nine minutes: slower than any restart window, but progress.
        for (let step = 0; step < 4; step++) {
          await jest.advanceTimersByTimeAsync(9 * 60_000)
          progress += 1
        }
        expect(initSpy).not.toHaveBeenCalled()
      }
    )
  })

  // Real bootstraps move in fine steps and can go backwards: a healthy local Tor was
  // observed sitting at loading_descriptors for 2m04s before advancing, and Tor
  // restarts its own bootstrap on a network change. Both are movement, not a stall.
  it('leaves Tor alone when bootstrap restarts itself and progress drops', async () => {
    let progress = 45
    await withStalledBootstrap(
      () => ignorableTimeoutStatus(progress, 'requesting_descriptors'),
      async ({ initSpy }) => {
        await jest.advanceTimersByTimeAsync(9 * 60_000)
        progress = 5 // Tor started over
        await jest.advanceTimersByTimeAsync(9 * 60_000)
        expect(initSpy).not.toHaveBeenCalled()
      }
    )
  })

  it('treats a done bootstrap as done whatever else the status line carries', async () => {
    // Not the canonical NOTICE/"Done" line: severity and trailing fields vary, and an
    // exact-string comparison would leave a finished Tor watched and restarted.
    const doneWithWarning =
      '250-status/bootstrap-phase=WARN BOOTSTRAP PROGRESS=100 TAG=done SUMMARY="Done" WARNING="Operation timed out" REASON=TIMEOUT COUNT=1 RECOMMENDATION=ignore'
    await withStalledBootstrap(
      () => doneWithWarning,
      async ({ initSpy }) => {
        await jest.advanceTimersByTimeAsync(2_000)
        expect(torService.bootstrapped).toBe(true)
        await jest.advanceTimersByTimeAsync(30 * 60_000)
        expect(initSpy).not.toHaveBeenCalled()
      }
    )
  })

  it('restarts managed Tor once bootstrap has made no progress for the full window', async () => {
    await withStalledBootstrap(
      () => ignorableTimeoutStatus(5, 'conn'),
      async ({ initSpy }) => {
        await jest.advanceTimersByTimeAsync(9 * 60_000)
        expect(initSpy).not.toHaveBeenCalled()
        await jest.advanceTimersByTimeAsync(2 * 60_000)
        expect(initSpy).toHaveBeenCalledTimes(1)
      }
    )
  })

  it('finishes bootstrapping when Tor gets there on its own', async () => {
    let status = ignorableTimeoutStatus(5, 'conn')
    await withStalledBootstrap(
      () => status,
      async ({ initSpy }) => {
        await jest.advanceTimersByTimeAsync(5 * 60_000)
        status = bootstrapDoneStatus
        await jest.advanceTimersByTimeAsync(2_000)
        expect(initSpy).not.toHaveBeenCalled()
        expect(torService.bootstrapped).toBe(true)
      }
    )
  })

  it('restarts managed Tor immediately when the process disappears during bootstrap', async () => {
    jest.useFakeTimers()
    const sendCommandSpy = jest.spyOn(torControl, 'sendCommand').mockResolvedValue({
      code: 250,
      messages: [
        '250-status/bootstrap-phase=NOTICE BOOTSTRAP PROGRESS=40 TAG=loading_keys SUMMARY="Loading authority key certs"',
        '250 OK',
      ],
    })
    const initSpy = jest.spyOn(torService, 'init').mockResolvedValue(undefined)
    const getTorProcessIdsSpy = jest.spyOn(torService, 'getTorProcessIds').mockReturnValue([])
    const torServiceInternals = torService as any

    try {
      torServiceInternals.torDataDirectory = `${tmpAppDataPath}/TorDataDirectory`
      torService.startBootstrapWatcher(1000)

      await jest.advanceTimersByTimeAsync(1000)

      expect(getTorProcessIdsSpy).toHaveBeenCalled()
      expect(sendCommandSpy).not.toHaveBeenCalled()
      expect(initSpy).toHaveBeenCalledTimes(1)
    } finally {
      torServiceInternals.stopBootstrapWatcher()
      jest.useRealTimers()
      sendCommandSpy.mockRestore()
      initSpy.mockRestore()
      getTorProcessIdsSpy.mockRestore()
    }
  })

  it('tor is initializing correctly with 40 seconds timeout', async () => {
    await torService.init()
  })

  it('attempt destroy nonexistent hidden service', async () => {
    await torService.init()

    const status = await torService.destroyHiddenService('u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad')
    expect(status).toBe(false)
  })

  it('should find hanging tor processes and kill them', async () => {
    const processKill = jest.spyOn(process, 'kill')
    await torService.init()
    const torIds = torService.getTorProcessIds()
    torService.clearHangingTorProcess()
    expect(processKill).toHaveBeenCalledTimes(torIds.length) // Spawning with {shell:true} starts 2 processes so we need to kill 2 processes
  })

  it('should find hanging tor processes and kill them if Quiet path includes space', async () => {
    const processKill = jest.spyOn(process, 'kill')
    await torService.init()
    const torIds = torService.getTorProcessIds()
    torService.clearHangingTorProcess()
    expect(processKill).toHaveBeenCalledTimes(torIds.length) // Spawning with {shell:true} starts 2 processes so we need to kill 2 processes
  })
})
