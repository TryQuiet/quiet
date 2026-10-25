import type { AppUpdater } from 'electron-updater'

/**
 * Authenticode subject the Windows installer must be signed with. Keep in sync with
 * `build.win.signtoolOptions.publisherName` in package.json (scripts/updater-security.test.cjs
 * enforces it). A full DN is pinned on purpose: electron-updater falls back to matching the CN
 * alone when given a bare name, which any CA-issued certificate with the same CN would satisfy.
 */
export const WINDOWS_PUBLISHER_NAMES: readonly string[] = ['CN=Zbay LLC, O=Zbay LLC, C=US']

type VerifyUpdateCodeSignature = (publisherNames: string[], filePath: string) => Promise<string | null>

// NsisUpdater keeps these as protected members, so they are not part of the public typings.
interface WindowsUpdater {
  verifyUpdateCodeSignature: VerifyUpdateCodeSignature
  verifySignature(filePath: string): Promise<string | null>
}

/**
 * electron-updater only checks a Windows installer's signature when the on-disk app-update.yml
 * carries a `publisherName`; without one `verifySignature` returns "valid" and the installer runs
 * with nothing but the feed's own sha512 as protection. Replace it so the check always runs
 * against the publisher compiled into the app, whatever app-update.yml says (or doesn't).
 */
const pinWindowsPublisher = (updater: AppUpdater) => {
  const windowsUpdater = updater as unknown as WindowsUpdater
  if (
    typeof windowsUpdater.verifySignature !== 'function' ||
    typeof windowsUpdater.verifyUpdateCodeSignature !== 'function'
  ) {
    throw new Error('electron-updater no longer exposes the Windows signature hooks')
  }
  windowsUpdater.verifySignature = (filePath: string) =>
    windowsUpdater.verifyUpdateCodeSignature([...WINDOWS_PUBLISHER_NAMES], filePath)
}

/**
 * Applies the update-verification policy. Throws if it cannot be applied, in which case the
 * caller must not check for or install updates.
 *
 * - Every platform: sha512 of the downloaded file must match the feed (electron-updater enforces
 *   it and fails the download otherwise); downgrades and web installers are refused.
 * - Windows: Authenticode signature pinned to WINDOWS_PUBLISHER_NAMES (see above).
 * - macOS: Squirrel.Mac refuses a bundle whose code signature does not satisfy the running app's
 *   designated requirement, so nothing to configure here.
 * - Linux AppImage: no signature exists; the sha512 from the HTTPS feed is the only check.
 */
export const hardenUpdater = (updater: AppUpdater, platform: NodeJS.Platform = process.platform) => {
  updater.allowDowngrade = false
  updater.disableWebInstaller = true
  if (platform === 'win32') {
    pinWindowsPublisher(updater)
  }
}
