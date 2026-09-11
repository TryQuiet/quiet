const { execFile } = require('node:child_process')
const path = require('node:path')
const { promisify } = require('node:util')
const { publisherNames, subjectsEqual } = require('./trust.cjs')

// Authenticode trust remains Windows' responsibility. A fixed encoded command
// and an environment argument avoid both cmd.exe and PowerShell interpolation.
const command = Buffer.from(`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Import-Module -Name ([System.IO.Path]::Combine($PSHOME, 'Modules', 'Microsoft.PowerShell.Security', 'Microsoft.PowerShell.Security.psd1')) -ErrorAction Stop
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$signature = Get-AuthenticodeSignature -LiteralPath $env:QUIET_VERIFY_INSTALLER
[PSCustomObject]@{
  Status = [int]$signature.Status
  Subject = $signature.SignerCertificate.Subject
  Path = $signature.Path
} | ConvertTo-Json -Compress
`, 'utf16le').toString('base64')

async function verifyWindowsSignature(names, file) {
  publisherNames(names)
  if (process.platform !== 'win32') throw new Error('Authenticode verification requires Windows')
  const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  // Node chooses the first case-insensitive duplicate environment key on Windows.
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => name.toUpperCase() !== 'PSMODULEPATH'))
  const { stdout, stderr } = await promisify(execFile)(executable,
    ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', command], {
      shell: false, windowsHide: true, timeout: 30_000, maxBuffer: 64 * 1024,
      env: { ...env, PSModulePath: path.join(path.dirname(executable), 'Modules'), QUIET_VERIFY_INSTALLER: path.resolve(file) },
    })
  if (stderr.trim()) throw new Error('Authenticode verification reported an error')
  const result = JSON.parse(stdout.replace(/^\uFEFF/, ''))
  if (result.Status !== 0 || typeof result.Subject !== 'string' ||
      typeof result.Path !== 'string' || path.resolve(result.Path) !== path.resolve(file) ||
      !names.some(name => subjectsEqual(name, result.Subject))) {
    throw new Error('Installer does not have a valid signature from an approved Windows publisher')
  }
  return null
}

module.exports = { verifyWindowsSignature }
