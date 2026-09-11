import { execFileSync, spawn, ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Tor } from './tor.service'

// Run explicitly against an owned emulator; no Quiet app or Tor process is changed.
// QUIET_ANDROID_TEST_SERIAL=emulator-5582 QUIET_ANDROID_TEST_AVD=quiet-api35-sdk
const serial = process.env.QUIET_ANDROID_TEST_SERIAL
const describeAndroid = serial ? describe : describe.skip
const adb = process.env.QUIET_ANDROID_TEST_ADB || 'adb'
const quote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`

describeAndroid('Android Tor process discovery with the real Toybox tools', () => {
  it('finds both matching processes, excludes its own detector, and returns empty after they exit', async () => {
    if (!serial || !/^emulator-\d+$/.test(serial) || !process.env.QUIET_ANDROID_TEST_AVD) {
      throw new Error('An explicit owned emulator serial and AVD name are required')
    }
    const runAdb = (args: string[]) =>
      execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 10000, stdio: 'pipe' }).trim()
    expect(runAdb(['emu', 'avd', 'name']).split('\n')[0].trim()).toBe(process.env.QUIET_ANDROID_TEST_AVD)

    // A unique marker avoids matching any real app process. Spaces exercise the
    // same quoting required for a data directory, without creating that directory.
    const marker = `/data/local/tmp/quiet tor test ${randomUUID()}/TorDataDirectory`
    const tor = Object.create(Tor.prototype) as Tor
    tor.torDataDirectory = marker
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!
    let command: string
    try {
      Object.defineProperty(process, 'platform', { value: 'android' })
      command = (tor as unknown as { hangingTorProcessCommand(): string }).hangingTorProcessCommand()
    } finally {
      Object.defineProperty(process, 'platform', platform)
    }
    const discover = () => runAdb(['shell', command]).split('\n').filter(Boolean).sort()
    const children: { child: ChildProcessWithoutNullStreams; pid?: string }[] = []
    let cleanupError: unknown

    try {
      expect(discover()).toEqual([])
      for (let index = 0; index < 2; index += 1) {
        // Keep a shell with the marker in argv alive. Each short sleep expires
        // naturally if cleanup interrupts its parent; no unrelated PID is killed.
        const script = 'echo $$; i=0; while [ "$i" -lt 60 ]; do sleep 1; i=$((i+1)); done'
        const child = spawn(adb, ['-s', serial, 'shell', `exec /system/bin/sh -c ${quote(script)} ${quote(marker)}`])
        const owned: { child: ChildProcessWithoutNullStreams; pid?: string } = { child }
        children.push(owned)
        owned.pid = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timed out starting the test-owned shell')), 10000)
          const fail = () => {
            clearTimeout(timeout)
            reject(new Error('The test-owned shell exited before reporting its PID'))
          }
          child.once('error', fail)
          child.once('exit', fail)
          let output = ''
          child.stdout.on('data', chunk => {
            output += chunk.toString()
            const pid = output.split('\n')[0].trim()
            if (!output.includes('\n')) return
            clearTimeout(timeout)
            if (!/^\d+$/.test(pid)) {
              reject(new Error('The test-owned shell returned an invalid PID'))
              return
            }
            child.removeListener('error', fail)
            child.removeListener('exit', fail)
            resolve(pid)
          })
        })
      }
      expect(discover()).toEqual(children.map(({ pid }) => pid).sort())
    } finally {
      for (const { child, pid } of children) {
        try {
          if (pid) runAdb(['shell', 'kill', '-TERM', pid])
        } catch (error) {
          cleanupError = cleanupError || error
        } finally {
          child.kill('SIGTERM')
        }
      }
    }
    if (cleanupError) throw cleanupError
    // Android's shell can defer TERM until its current short sleep has exited.
    const deadline = Date.now() + 5000
    let remaining = discover()
    while (remaining.length > 0 && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 50))
      remaining = discover()
    }
    expect(remaining).toEqual([])
  }, 45000)
})
