import { jest } from '@jest/globals'

import { EventEmitter } from 'events'
import childProcess from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { sleep } from '../common/sleep'
import { TorControl } from './tor-control.service'
import { TorControlAuthType, TorParamsProvider, TorPasswordProvider } from './tor.types'

const spawn = jest.fn()
jest.unstable_mockModule('child_process', () => ({
  ...childProcess,
  default: { ...childProcess, spawn },
  spawn,
}))

const { Tor } = await import('./tor.service')

// A Tor that never bootstraps is restarted while a hidden-service publication is in
// flight. Both halves of #3570 live here: the publication rejecting into a listener
// nobody awaits (which shuts the backend down), and the init stopwatch restarting a
// Tor the progress watcher is still waiting on.
describe('Tor restarts while a hidden service is being published', () => {
  const controlPort = 19251
  const httpTunnelPort = 18318

  let quietDirs: string[] = []

  const makeQuietDir = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-tor-restart-'))
    quietDirs.push(dir)
    return dir
  }

  afterEach(() => {
    for (const dir of quietDirs) fs.rmSync(dir, { force: true, recursive: true })
    quietDirs = []
  })

  const fakeTorProcess = () => {
    const proc = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter }
    proc.stdout = new EventEmitter()
    proc.stderr = new EventEmitter()
    return proc
  }

  // Node reports an unhandled rejection once the microtask queue has drained.
  const flush = async () => {
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
  }

  const createTorService = () => {
    const quietDir = makeQuietDir()
    const configOptions: ConfigOptions = {
      options: {},
      socketIOPort: 0,
      httpTunnelPort,
      torControlPort: controlPort,
      env: {},
    }
    const torControl = new TorControl(
      {
        port: controlPort,
        host: 'localhost',
        auth: { type: TorControlAuthType.PASSWORD, value: 'password' },
      },
      configOptions
    )
    const torParamsProvider: TorParamsProvider = {
      torPath: path.join(quietDir, 'tor'),
      options: { env: { LD_LIBRARY_PATH: undefined, HOME: '' }, detached: false },
    }
    const torPasswordProvider: TorPasswordProvider = { torPassword: '', torHashedPassword: '' }
    const serverIoProvider = { io: { emit: jest.fn() } } as unknown as ServerIoProviderTypes
    const torService = new Tor(
      configOptions,
      quietDir,
      torParamsProvider,
      torPasswordProvider,
      serverIoProvider,
      torControl
    )
    torService.socksPort = 19250
    torService.torDataDirectory = path.join(quietDir, 'TorDataDirectory')
    torService.torPidPath = path.join(quietDir, 'torPid.json')
    // Keep the test off the real process table, and off the interval that would
    // otherwise drive its own control-port I/O.
    jest.spyOn(torService, 'getTorProcessIds').mockReturnValue([])
    jest.spyOn(torService, 'startBootstrapWatcher').mockImplementation(() => undefined)
    return { torControl, torService }
  }

  it('reports Tor as started even when publishing its hidden services fails', async () => {
    const { torService } = createTorService()
    const publicationFailure = new Error('Tor control event connection closed while waiting for HS_DESC')
    const spawnHiddenServices = jest.spyOn(torService, 'spawnHiddenServices').mockRejectedValue(publicationFailure)
    spawn.mockReturnValue(fakeTorProcess())

    const unhandled: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandledRejection)
    try {
      const spawned = (torService as unknown as { spawnTor(): Promise<void> }).spawnTor()
      torService.process!.stdout.emit('data', Buffer.from('[notice] Bootstrapped 0% (starting): Starting'))
      await flush()
      // Raced rather than awaited: an unfixed spawn never settles, and this should
      // report that rather than sitting on it until jest's own timeout.
      const settled = await Promise.race([
        spawned.then(() => 'resolved' as const),
        sleep(250).then(() => 'pending' as const),
      ])

      expect(spawnHiddenServices).toHaveBeenCalledTimes(1)
      // Publishing rejected inside a listener nobody awaits. The backend shuts
      // itself down on an unhandled rejection, which is the crash in #3570.
      expect(unhandled).toEqual([])
      // A Tor at 0% cannot upload a descriptor yet, so gating this on publication
      // held init() for the whole event timeout - long enough for the next restart
      // to tear the control connection down underneath it.
      expect(settled).toBe('resolved')
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })

  it('leaves restarts to the bootstrap watcher once Tor has started', async () => {
    const { torService } = createTorService()
    jest.spyOn(torService as unknown as { spawnTor(): Promise<void> }, 'spawnTor').mockResolvedValue(undefined)
    const isBootstrappingFinished = jest.spyOn(torService, 'isBootstrappingFinished').mockResolvedValue(false)
    const init = jest.spyOn(torService, 'init')

    await torService.init(50)
    await sleep(250)

    // The watcher measures a stall by progress and restarts after ten minutes of
    // none. A second clock here restarted Tor every two minutes regardless, which
    // is what threw away bootstrap progress on both platforms in #3570.
    expect(init).toHaveBeenCalledTimes(1)
    expect(isBootstrappingFinished).not.toHaveBeenCalled()
  })

  it('restarts Tor when it never reports starting at all', async () => {
    const { torService } = createTorService()
    jest
      .spyOn(torService as unknown as { spawnTor(): Promise<void> }, 'spawnTor')
      .mockReturnValue(new Promise<void>(() => undefined))
    const isBootstrappingFinished = jest.spyOn(torService, 'isBootstrappingFinished').mockResolvedValue(false)
    const init = jest.spyOn(torService, 'init')

    void torService.init(50)
    await sleep(250)

    expect(isBootstrappingFinished).toHaveBeenCalled()
    expect(init.mock.calls.length).toBeGreaterThan(1)

    torService.resetBootstrapState()
  })
})
