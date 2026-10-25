import { execFile } from 'child_process'
import path from 'path'
import { parseDn } from 'builder-util-runtime'
import type { AppUpdater } from 'electron-updater'

/**
 * Authenticode subject the Windows installer must be signed with. Keep in sync with
 * `build.win.signtoolOptions.publisherName` in package.json (scripts/updater-security.test.cjs
 * enforces it). A full DN is pinned on purpose: electron-updater falls back to matching the CN
 * alone when given a bare name, which any CA-issued certificate with the same CN would satisfy.
 */
export const WINDOWS_PUBLISHER_NAMES: readonly string[] = ['CN=Zbay LLC, O=Zbay LLC, C=US']

/** Resolves to null when the installer is acceptable, otherwise to the reason it is not. */
export type VerifyWindowsInstaller = (
  publisherNames: readonly string[],
  filePath: string,
  expectedVersion: string | undefined
) => Promise<string | null>

type RunPowerShell = (script: string, filePath: string) => Promise<string>

const POWERSHELL_TIMEOUT_MS = 30_000

// The path travels in an environment variable so it never has to be quoted into the script.
const AUTHENTICODE_SCRIPT = [
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
  '$f = $env:QUIET_UPDATE_FILE',
  '$s = Get-AuthenticodeSignature -LiteralPath $f',
  '$v = (Get-Item -LiteralPath $f).VersionInfo',
  '[pscustomobject]@{ Status = [int]$s.Status; Path = $s.Path; Subject = $s.SignerCertificate.Subject; ProductVersion = $v.ProductVersion } | ConvertTo-Json -Compress',
].join('; ')

const runPowerShell: RunPowerShell = (script, filePath) =>
  new Promise((resolve, reject) => {
    const systemRoot = process.env.SystemRoot ?? 'C:\\Windows'
    const env: NodeJS.ProcessEnv = { ...process.env, QUIET_UPDATE_FILE: filePath }
    // A foreign PSModulePath can make PowerShell load incompatible modules.
    delete env.PSModulePath
    execFile(
      path.win32.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
      ['-NoProfile', '-NonInteractive', '-InputFormat', 'None', '-Command', script],
      { env, timeout: POWERSHELL_TIMEOUT_MS, windowsHide: true },
      (error, stdout, stderr) => {
        if (error != null) reject(error)
        else if (stderr) reject(new Error(`PowerShell wrote to stderr: ${stderr}`))
        else resolve(stdout)
      }
    )
  })

const sameDn = (pinned: string, subject: string) => {
  const wanted = parseDn(pinned)
  const actual = parseDn(subject)
  return wanted.size > 0 && Array.from(wanted.keys()).every(key => wanted.get(key) === actual.get(key))
}

/**
 * Accepts an installer only if Windows reports a valid Authenticode signature (status 0: trusted
 * chain, certificate valid at signing time) whose signer matches a pinned DN, and if the version
 * stamped into the signed file is the version the feed announced.
 *
 * electron-updater's own verifier cannot be used as is: when PowerShell cannot be executed it logs
 * "ignoring signature validation" and reports success. Here any failure to obtain a verdict is a
 * rejection.
 *
 * The version check closes a replay: the feed's version string is unauthenticated, so without it a
 * feed could announce 99.0.0 and serve an older, validly signed Quiet.
 */
export const verifyWindowsInstaller = async (
  publisherNames: readonly string[],
  filePath: string,
  expectedVersion: string | undefined,
  run: RunPowerShell = runPowerShell
): Promise<string | null> => {
  if (publisherNames.length === 0) return 'no publisher is pinned'
  if (!expectedVersion) return 'the announced update version is unknown'
  let info: { Status?: unknown; Path?: unknown; Subject?: unknown; ProductVersion?: unknown }
  try {
    info = JSON.parse(await run(AUTHENTICODE_SCRIPT, filePath))
  } catch (error) {
    return `could not verify the signature: ${(error as Error).message}`
  }
  if (info == null || typeof info !== 'object') return 'unreadable signature verdict'
  if (info.Status !== 0) return `signature status is ${String(info.Status)}, not valid`
  if (typeof info.Path === 'string' && path.win32.normalize(info.Path) !== path.win32.normalize(filePath)) {
    return 'signature verdict is for a different file'
  }
  if (typeof info.Subject !== 'string' || !publisherNames.some(name => sameDn(name, info.Subject as string))) {
    return `signed by ${String(info.Subject)}, expected ${publisherNames.join(' | ')}`
  }
  if (info.ProductVersion !== expectedVersion) {
    return `installer is version ${String(info.ProductVersion)}, the feed announced ${expectedVersion}`
  }
  return null
}

// NsisUpdater keeps these as protected members, so they are not part of the public typings.
interface WindowsUpdater {
  verifySignature(filePath: string): Promise<string | null>
  updateInfoAndProvider?: { info?: { version?: string } } | null
}

/**
 * electron-updater only checks a Windows installer's signature when the on-disk app-update.yml
 * carries a `publisherName`; without one `verifySignature` returns "valid" and the installer runs
 * with nothing but the feed's own sha512 as protection. Replace it so the check always runs
 * against the publisher compiled into the app, whatever app-update.yml says (or doesn't).
 */
const pinWindowsPublisher = (updater: AppUpdater, verify: VerifyWindowsInstaller) => {
  const windowsUpdater = updater as unknown as WindowsUpdater
  if (typeof windowsUpdater.verifySignature !== 'function') {
    throw new Error('electron-updater no longer exposes the Windows signature hook')
  }
  windowsUpdater.verifySignature = (filePath: string) =>
    verify(WINDOWS_PUBLISHER_NAMES, filePath, windowsUpdater.updateInfoAndProvider?.info?.version)
}

/**
 * Applies the update-verification policy. Throws if it cannot be applied, in which case the
 * caller must not check for or install updates.
 *
 * - Every platform: sha512 of the downloaded file must match the feed (electron-updater enforces
 *   it and fails the download otherwise); downgrades and web installers are refused.
 * - Windows: Authenticode signature pinned to WINDOWS_PUBLISHER_NAMES and bound to the announced
 *   version (see verifyWindowsInstaller).
 * - macOS: Squirrel.Mac refuses a bundle whose code signature does not satisfy the running app's
 *   designated requirement, so nothing to configure here.
 * - Linux AppImage: no signature exists; the sha512 from the HTTPS feed is the only check.
 */
export const hardenUpdater = (
  updater: AppUpdater,
  platform: NodeJS.Platform = process.platform,
  verifyInstaller: VerifyWindowsInstaller = verifyWindowsInstaller
) => {
  updater.allowDowngrade = false
  updater.disableWebInstaller = true
  if (platform === 'win32') {
    pinWindowsPublisher(updater, verifyInstaller)
  }
}
