import { jest } from '@jest/globals'

type Callback = (error: Error | null, result?: { stdout: string; stderr: string }) => void
const calls: Array<{ file: string; args: string[]; options: Record<string, unknown> }> = []
let outcomes: Array<Error | string> = []

const execFile = (file: string, args: string[], options: Record<string, unknown>, callback: Callback) => {
  calls.push({ file, args, options })
  const outcome = outcomes.shift() ?? ''
  if (outcome instanceof Error) callback(outcome)
  else callback(null, { stdout: outcome, stderr: '' })
  return {}
}

jest.unstable_mockModule('child_process', () => ({ execFile, default: { execFile } }))

const { getWindowsTorProcessIds } = await import('./windows-tor-processes')

const timedOut = () =>
  Object.assign(new Error('Command failed: powershell.exe'), { killed: true, signal: 'SIGTERM', code: null })

describe('getWindowsTorProcessIds', () => {
  beforeEach(() => {
    calls.length = 0
    outcomes = []
  })

  it('runs the PowerShell query without a console window, scoped to the data directory', async () => {
    outcomes = ['4242\r\n4343\r\n']

    await expect(getWindowsTorProcessIds('C:\\Users\\me\\Quiet\\TorDataDirectory')).resolves.toEqual(['4242', '4343'])

    expect(calls).toHaveLength(1)
    expect(calls[0].file).toBe('powershell.exe')
    expect(calls[0].options).toMatchObject({
      windowsHide: true,
      timeout: 10_000,
      env: expect.objectContaining({ QUIET_TOR_DATA_DIR: 'C:\\Users\\me\\Quiet\\TorDataDirectory' }),
    })
  })

  it('retries one timed-out query with the same hidden-window options', async () => {
    outcomes = [timedOut(), '77']

    await expect(getWindowsTorProcessIds('C:\\Quiet\\TorDataDirectory')).resolves.toEqual(['77'])

    expect(calls).toHaveLength(2)
    expect(calls.every(call => call.options.windowsHide === true)).toBe(true)
  })

  it('stays fail-closed when the retry also fails', async () => {
    outcomes = [timedOut(), timedOut()]

    await expect(getWindowsTorProcessIds('C:\\Quiet\\TorDataDirectory')).rejects.toThrow('Command failed')
    expect(calls).toHaveLength(2)
  })
})
