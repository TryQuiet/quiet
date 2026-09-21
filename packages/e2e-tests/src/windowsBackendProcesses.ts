import { execFileSync } from 'child_process'

/** Find only the packaged backend belonging to this test's data directory. */
export function getWindowsBackendPids(dataDirPath: string): number[] {
  if (!dataDirPath) throw new Error('A data directory is required to find the backend')
  // Pass the path as data, not PowerShell source (paths can contain apostrophes).
  // CIM is available on current Windows runners, unlike the removed wmic.exe.
  const output = execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `$ErrorActionPreference = 'Stop'
      $directory = [regex]::Escape($env:QUIET_E2E_DATA_DIR) + '(?=["\\s]|$)'
      Get-CimInstance Win32_Process -Filter "Name = 'Quiet.exe'" |
        Where-Object { $_.CommandLine -match 'backend-bundle[\\\\/]bundle\\.cjs' -and $_.CommandLine -match $directory } |
        Select-Object -ExpandProperty ProcessId`,
    ],
    { encoding: 'utf8', env: { ...process.env, QUIET_E2E_DATA_DIR: dataDirPath }, timeout: 15_000 }
  )
  return output
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter(pid => Number.isInteger(pid) && pid > 0)
}
