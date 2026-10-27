import { execFile } from 'child_process'
import { promisify } from 'util'

const executeFile = promisify(execFile)

/** Query only Tor processes, then match this profile as a complete argument. */
export const getWindowsTorProcessIds = async (dataDirectory: string): Promise<string[]> => {
  if (!dataDirectory) throw new Error('A Tor data directory is required for process discovery')
  const query = async () =>
    await executeFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `$ErrorActionPreference = 'Stop'
      $directory = [regex]::Escape($env:QUIET_TOR_DATA_DIR) + '(?=["\\s]|$)'
      Get-CimInstance Win32_Process -Filter "Name = 'tor.exe'" |
        Where-Object { $_.CommandLine -match $directory } |
        Select-Object -ExpandProperty ProcessId`,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, QUIET_TOR_DATA_DIR: dataDirectory },
        timeout: 10_000,
        // The backend is forked from Electron's GUI main process and has no console, so
        // without this Windows creates a console window for every PowerShell query: a
        // visible flash for users, and on the hosted CI runner a query that never
        // finishes, so every launch and quit sat through both 10s timeouts.
        windowsHide: true,
      }
    )
  let output: Awaited<ReturnType<typeof query>>
  try {
    output = await query()
  } catch (error) {
    const failure = error as Error & { killed?: boolean; signal?: string; code?: string | number | null }
    // A cold/loaded Windows CIM provider can outlive one PowerShell query. Give
    // that timeout one fresh attempt, with the same bound. Never treat a query
    // failure as "no Tor process": startup must remain fail-closed.
    if (!(failure.killed === true && failure.signal === 'SIGTERM' && failure.code == null)) throw error
    output = await query()
  }
  return output.stdout
    .trim()
    .split(/\s+/)
    .filter(pid => /^\d+$/.test(pid))
}
