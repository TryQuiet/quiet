import { execFile } from 'child_process'
import { promisify } from 'util'

const executeFile = promisify(execFile)

/** Query only Tor processes, then match this profile as a complete argument. */
export const getWindowsTorProcessIds = async (dataDirectory: string): Promise<string[]> => {
  if (!dataDirectory) throw new Error('A Tor data directory is required for process discovery')
  const { stdout } = await executeFile(
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
    { encoding: 'utf8', env: { ...process.env, QUIET_TOR_DATA_DIR: dataDirectory }, timeout: 10_000 }
  )
  return stdout
    .trim()
    .split(/\s+/)
    .filter(pid => /^\d+$/.test(pid))
}
