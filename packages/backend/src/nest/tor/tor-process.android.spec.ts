import * as childProcess from 'child_process'
import { randomBytes } from 'crypto'
import { jest } from '@jest/globals'
import type { Tor as TorService } from './tor.service'

const execSync = jest.fn<(command: string) => Buffer>()
jest.unstable_mockModule('child_process', () => ({ ...childProcess, execSync }))
const { Tor } = await import('./tor.service')

// Opt in with a dedicated emulator: exercise the production command against
// Android's real Toybox, whose pgrep options differ from GNU pgrep.
const serial = process.env.QUIET_DM_ANDROID_DEVICE
const androidSuite = serial ? describe : describe.skip
androidSuite('Android managed Tor process discovery', () => {
  const adb = process.env.ADB_PATH ?? 'adb'
  const marker = `quiet-tor-health-${randomBytes(12).toString('hex')}`
  let remote: childProcess.ChildProcess
  let pid: string
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
  const android = (command: string) => childProcess.execFileSync(adb, ['-s', serial!, 'shell', command])

  afterAll(() => {
    Object.defineProperty(process, 'platform', platform)
    if (pid) {
      const children = android('ps -A -o PID,PPID')
        .toString()
        .split('\n')
        .map(line => line.trim().split(/\s+/))
        .filter(([_pid, parent]) => parent === pid)
        .map(([child]) => child)
      const ids = [...children, pid]
      if (ids.every(id => /^\d+$/.test(id))) android(`kill ${ids.join(' ')} 2>/dev/null || true`)
    }
    remote?.kill()
    jest.restoreAllMocks()
  })

  it('finds a live process by its data-directory argument instead of falsely restarting it', async () => {
    remote = childProcess.spawn(adb, ['-s', serial!, 'shell', `sh -c 'echo $$; sleep 120; :' ${marker}`])
    pid = await new Promise<string>((resolve, reject) => {
      remote.once('error', reject)
      remote.stdout!.once('data', data => resolve(data.toString().trim()))
      remote.once('exit', code => reject(new Error(`Android fixture exited early: ${code}`)))
    })
    expect(pid).toMatch(/^\d+$/)
    Object.defineProperty(process, 'platform', { value: 'android' })
    execSync.mockImplementation(command => android(command))
    const service = Object.create(Tor.prototype) as TorService
    service.torDataDirectory = marker
    expect(service.getTorProcessIds()).toContain(pid)
  }, 20_000)
})
