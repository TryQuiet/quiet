import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { CancellationToken, configureRequestOptions, configureRequestUrl } from 'builder-util-runtime'
import type { AppUpdater } from 'electron-updater'
import signingKeys from './update-signing-keys.json'

/**
 * Ed25519 public keys (base64 SPKI DER) whose signatures make a Windows installer or Linux
 * AppImage acceptable. The private half signs each release in CI (scripts/updateSigning.cjs).
 * A list so a key can be rotated: ship a release that carries both, signed with the old one.
 */
export const UPDATE_SIGNING_PUBLIC_KEYS: readonly string[] = signingKeys.publicKeys

/**
 * What the release key signs. It binds the app version, the file name and the file's sha512, so a
 * signature cannot be replayed for another version or file. Must stay byte-identical to
 * `updateStatement` in scripts/updateSigning.cjs.
 */
export const updateStatement = (version: string, fileName: string, sha512Base64: string) =>
  `quiet-update-signature-v1\nversion:${version}\nfile:${fileName}\nsha512:${sha512Base64}\n`

const SIGNATURE_TIMEOUT_MS = 30_000
const MAX_SIGNATURE_BYTES = 4096

/** Fetches the text of a detached signature. Not trusted: whatever it returns is verified. */
export type FetchSignature = (url: URL) => Promise<string>

interface HttpExecutor {
  // Not in the public typings; it is what downloadToBuffer is built on.
  doDownload(requestOptions: object, options: object, redirectCount: number): void
}
interface SignatureResponse {
  headers: Record<string, string | string[] | undefined>
  on(event: string, handler: (...args: any[]) => void): unknown
}

// Goes through the updater's own HTTP executor so the request uses Electron's network stack, and
// with it the system proxy settings that the update download itself relies on. The body is read as
// a stream and the request is aborted as soon as it passes the limit, so a hostile feed cannot make
// the app buffer an arbitrarily large "signature" (HttpExecutor.downloadToBuffer would take 500 MB).
const fetchSignatureWith =
  (updater: AppUpdater): FetchSignature =>
  async url => {
    const executor = (updater as unknown as { httpExecutor?: HttpExecutor }).httpExecutor
    if (executor == null || typeof executor.doDownload !== 'function') {
      throw new Error('electron-updater has no HTTP executor')
    }
    const cancellationToken = new CancellationToken()
    const timer = setTimeout(() => cancellationToken.cancel(), SIGNATURE_TIMEOUT_MS)
    let tooLarge = false
    try {
      const body = await cancellationToken.createPromise<Buffer>((resolve, reject, onCancel) => {
        const requestOptions: Record<string, unknown> = { redirect: 'manual' }
        configureRequestUrl(url, requestOptions as any)
        configureRequestOptions(requestOptions as any)
        const chunks: Buffer[] = []
        let received = 0
        const overflow = () => {
          tooLarge = true
          cancellationToken.cancel() // aborts the request
        }
        executor.doDownload(
          {
            ...requestOptions,
          },
          {
            destination: null,
            options: { cancellationToken },
            onCancel,
            callback: (error: Error | null) => (error == null ? resolve(Buffer.concat(chunks)) : reject(error)),
            responseHandler: (response: SignatureResponse, callback: (error: Error | null) => void) => {
              const declared = Number([response.headers['content-length']].flat()[0])
              if (declared > MAX_SIGNATURE_BYTES) return overflow()
              response.on('data', (chunk: Buffer) => {
                received += chunk.length
                if (received > MAX_SIGNATURE_BYTES) return overflow()
                chunks.push(chunk)
              })
              response.on('end', () => callback(null))
            },
          },
          0
        )
      })
      return body.toString('utf8')
    } catch (error) {
      if (tooLarge) throw new Error(`signature file is larger than ${MAX_SIGNATURE_BYTES} bytes`)
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

const sha512OfFile = (filePath: string) =>
  new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha512')
    fs.createReadStream(filePath)
      .on('data', chunk => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('base64')))
  })

const toPublicKey = (base64Spki: string) =>
  crypto.createPublicKey({ key: Buffer.from(base64Spki, 'base64'), format: 'der', type: 'spki' })

interface SignedDownload {
  filePath: string
  fileName: string
  version: string | undefined
  signatureUrl: URL
}

const SIGNATURE_PATTERN = /^[A-Za-z0-9+/]{86}==$/

/** Whether `signature` (base64) is a release-key signature of exactly this version, file name and hash. */
const signatureMatches = (
  version: string,
  fileName: string,
  sha512Base64: string,
  signature: string,
  publicKeys: readonly string[]
) => {
  const statement = Buffer.from(updateStatement(version, fileName, sha512Base64))
  const bytes = Buffer.from(signature, 'base64')
  return publicKeys.some(key => crypto.verify(null, statement, toPublicKey(key), bytes))
}

interface Verdict {
  problem: string | null
  sha512?: string
  signature?: string
}

const inspectDownload = async (
  download: SignedDownload,
  publicKeys: readonly string[],
  fetchSignature: FetchSignature
): Promise<Verdict> => {
  if (publicKeys.length === 0) return { problem: 'no release signing key is configured' }
  if (!download.version) return { problem: 'the announced update version is unknown' }
  // Both come from the feed. Keep the signed statement well formed whatever the feed says.
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(download.version) || /[\r\n]/.test(download.fileName)) {
    return { problem: 'the announced version or file name is malformed' }
  }
  let signature: string
  try {
    signature = (await fetchSignature(download.signatureUrl)).trim()
  } catch (error) {
    return { problem: `could not fetch the signature ${download.signatureUrl.href}: ${(error as Error).message}` }
  }
  if (!SIGNATURE_PATTERN.test(signature)) return { problem: 'the signature file is malformed' }
  let sha512: string
  try {
    sha512 = await sha512OfFile(download.filePath)
  } catch (error) {
    return { problem: `could not hash the download: ${(error as Error).message}` }
  }
  if (!signatureMatches(download.version, download.fileName, sha512, signature, publicKeys)) {
    return { problem: 'the signature does not match this version and file' }
  }
  return { problem: null, sha512, signature }
}

/**
 * Resolves to null when `filePath` carries a valid release-key signature for exactly this version
 * and file name, otherwise to the reason it is not acceptable. Any failure to reach a verdict
 * (no signature, unreadable file, network error) is a rejection.
 */
export const verifyUpdateSignature = async (
  download: SignedDownload,
  publicKeys: readonly string[],
  fetchSignature: FetchSignature
): Promise<string | null> => (await inspectDownload(download, publicKeys, fetchSignature)).problem

// The verified copy an update is installed from lives under the app's own cache directory (not the shared
// temp directory), in a directory per install named exactly `v-` plus mkdtemp's six characters.
const INSTALL_COPIES_DIR = 'quiet-verified-installers'
const INSTALL_COPY_PREFIX = 'v-'
const INSTALL_COPY_NAME = /^v-[A-Za-z0-9]{6}$/
const INSTALL_COPY_MAX_AGE_MS = 24 * 60 * 60 * 1000

const bestEffortRemove = (target: string) => {
  try {
    fs.rmSync(target, { recursive: true, force: true })
  } catch {
    // never let cleanup replace the outcome it belongs to
  }
}

const installCopiesParent = (baseCachePath: unknown) =>
  typeof baseCachePath === 'string' && path.isAbsolute(baseCachePath)
    ? path.join(baseCachePath, INSTALL_COPIES_DIR)
    : null

/** Copies an earlier launch ran its installer from are not needed after the installer is done. */
const removeStaleInstallCopies = (parent: string | null) => {
  if (parent == null) return
  try {
    for (const entry of fs.readdirSync(parent)) {
      if (!INSTALL_COPY_NAME.test(entry)) continue
      const dir = path.join(parent, entry)
      const stat = fs.lstatSync(dir)
      if (stat.isDirectory() && !stat.isSymbolicLink() && Date.now() - stat.mtimeMs > INSTALL_COPY_MAX_AGE_MS) {
        bestEffortRemove(dir)
      }
    }
  } catch {
    // best effort
  }
}

const sha512OfFileSync = (filePath: string) => {
  const hash = crypto.createHash('sha512')
  const buffer = Buffer.alloc(1 << 20)
  const fd = fs.openSync(filePath, 'r')
  try {
    for (
      let read = fs.readSync(fd, buffer, 0, buffer.length, null);
      read > 0;
      read = fs.readSync(fd, buffer, 0, buffer.length, null)
    ) {
      hash.update(buffer.subarray(0, read))
    }
  } finally {
    fs.closeSync(fd)
  }
  return hash.digest('base64')
}

// electron-updater keeps these as protected members, so they are not part of the public typings.
interface DownloadTaskOptions {
  fileInfo: { url: URL }
  downloadUpdateOptions: { updateInfoAndProvider?: { info?: { version?: string } } | null }
  task: (tempFile: string, ...rest: unknown[]) => Promise<void>
}
interface DownloadedUpdateHelper {
  getValidCachedUpdateFile(...args: unknown[]): Promise<string | null>
}
interface UpdaterInternals {
  executeDownload(options: DownloadTaskOptions): Promise<unknown>
  getOrCreateDownloadHelper(): Promise<DownloadedUpdateHelper>
  // BaseUpdater (Windows, Linux): both quitAndInstall() and install-on-quit end up here
  install(...args: unknown[]): boolean
  installerPath: string | null
  downloadedUpdateHelper: {
    _file: string | null
    downloadedFileInfo?: { isAdminRightsRequired?: boolean } | null
  } | null
  app: { baseCachePath?: unknown }
  spawnLog(command: string, args?: string[], ...rest: unknown[]): Promise<unknown>
  dispatchError(error: Error): void
}

/** What the release key vouched for, kept so the file can be checked again right before it is run. */
interface VerifiedInstall {
  filePath: string
  version: string
  fileName: string
  sha512: string
  signature: string
}

/**
 * Makes every download prove itself with a release-key signature before electron-updater accepts
 * it. Nothing in electron-updater does this for us: on Windows its own check only runs when the
 * on-disk app-update.yml names a publisher (and trusts a CA-issued certificate, not our key), and
 * on Linux the AppImage has no signature at all, so the sha512 from the feed, which sits next to
 * the file, is the only protection.
 *
 * The check runs inside the download task, on the temporary file, before electron-updater records
 * the file as downloaded, so a rejected file is deleted and can neither be announced nor
 * installed when the app quits. The version comes from the download being executed, not from the
 * updater's mutable "latest check" state, so overlapping checks cannot mix versions up.
 *
 * An installer left in the cache by an earlier launch is never reused: electron-updater hands it
 * back after comparing hashes only, which would skip this check, so a feed could announce a new
 * version whose hash is that of an older cached installer. Within one launch the cached file was
 * verified against the very same announcement, so that stays.
 */
const requireSignedDownloads = (updater: AppUpdater, publicKeys: readonly string[], fetchSignature: FetchSignature) => {
  const internals = updater as unknown as UpdaterInternals
  if (
    typeof internals.executeDownload !== 'function' ||
    typeof internals.getOrCreateDownloadHelper !== 'function' ||
    typeof internals.install !== 'function' ||
    typeof internals.spawnLog !== 'function'
  ) {
    throw new Error('electron-updater no longer exposes its download hooks')
  }
  if (publicKeys.length === 0) throw new Error('no update signing key is configured')
  publicKeys.forEach(toPublicKey) // throws on a malformed key

  const copiesParent = installCopiesParent(internals.app?.baseCachePath)
  removeStaleInstallCopies(copiesParent)
  let verified: VerifiedInstall | null = null
  const executeDownload = internals.executeDownload.bind(internals)
  internals.executeDownload = options => {
    const { fileInfo, downloadUpdateOptions, task } = options
    const version = downloadUpdateOptions.updateInfoAndProvider?.info?.version
    const signatureUrl = new URL(fileInfo.url.href)
    signatureUrl.pathname = `${signatureUrl.pathname}.sig`
    const fileName = path.posix.basename(decodeURIComponent(fileInfo.url.pathname))
    // Alpha and stable builds are signed with the same key, so a stable install must not be moved
    // onto a pre-release build, however genuine its signature. Refused before anything is fetched.
    if (version?.includes('-') && updater.currentVersion.prerelease.length === 0) {
      return Promise.reject(
        new Error(`Pre-release ${version} is not offered to a stable ${updater.currentVersion.version} install`)
      )
    }
    let verdict: Verdict | null = null
    return executeDownload({
      ...options,
      task: async (tempFile, ...rest) => {
        await task(tempFile, ...rest)
        verdict = await inspectDownload(
          { filePath: tempFile, fileName, version, signatureUrl },
          publicKeys,
          fetchSignature
        )
        if (verdict.problem != null) {
          throw new Error(`New version ${version} is not signed by the Quiet release key: ${verdict.problem}`)
        }
      },
    }).then(result => {
      // electron-updater has now moved the file into place and recorded it as the update to install
      const accepted = verdict as Verdict | null
      if (accepted?.sha512 != null && accepted.signature != null && internals.installerPath != null) {
        verified = {
          filePath: internals.installerPath,
          version: version!,
          fileName,
          sha512: accepted.sha512,
          signature: accepted.signature,
        }
      }
      return result
    })
  }

  // Quiet installs per user, so an update never needs administrator rights. electron-updater would run
  // an installer through elevate.exe when the feed says it needs them, or when starting it directly fails;
  // that would hand a file path across an elevation boundary, where a same-user process could swap the
  // bytes after they were checked. Refuse that path outright rather than defend it.
  const spawnLog = internals.spawnLog.bind(internals)
  internals.spawnLog = (command, ...rest) => {
    if (path.basename(String(command).replace(/\\/g, '/')).toLowerCase() === 'elevate.exe') {
      return Promise.reject(new Error('Refusing to run the update installer elevated: Quiet updates install per user'))
    }
    return spawnLog(command, ...rest)
  }

  // electron-updater installs whatever file the path it remembers points to, with no further check,
  // both for quitAndInstall() and for install-on-quit, and that path is in a directory the user can
  // write. So at install time the verified file is copied into a fresh private directory under the
  // app's cache (created exclusively, mode 0700), the copy is hashed and its signature checked, and the
  // installer is run from that copy; the original path is never installed. The checks and the copy are
  // synchronous (the quit handler cannot wait). Apart from elevation, which is refused above, a process
  // running as the same user could still replace the copy before the installer starts; it can already
  // modify the installed app, so that is outside what this defends.
  const install = internals.install.bind(internals)
  internals.install = (...args) => {
    const refuse = (reason: string) => {
      internals.dispatchError(new Error(`Refusing to install the update: ${reason}`))
      return false
    }
    const accepted = verified
    const helper = internals.downloadedUpdateHelper
    if (accepted == null || helper == null || internals.installerPath !== accepted.filePath) {
      return refuse('it is not the file that was verified')
    }
    if (helper.downloadedFileInfo?.isAdminRightsRequired === true) {
      return refuse('it asks for administrator rights, and Quiet updates install per user')
    }
    if (copiesParent == null) return refuse('the app has no cache directory to verify the file in')
    let privateDir: string | null = null
    try {
      fs.mkdirSync(copiesParent, { recursive: true, mode: 0o700 })
      privateDir = fs.mkdtempSync(path.join(copiesParent, INSTALL_COPY_PREFIX))
      fs.chmodSync(privateDir, 0o700)
      const copy = path.join(privateDir, path.basename(accepted.filePath))
      fs.copyFileSync(accepted.filePath, copy, fs.constants.COPYFILE_EXCL)
      fs.chmodSync(copy, 0o700)
      const sha512 = sha512OfFileSync(copy)
      if (
        sha512 !== accepted.sha512 ||
        !signatureMatches(accepted.version, accepted.fileName, sha512, accepted.signature, publicKeys)
      ) {
        bestEffortRemove(privateDir)
        bestEffortRemove(accepted.filePath)
        verified = null
        return refuse('the downloaded file changed after it was verified')
      }
      // electron-updater reads the path from here; point it at the verified copy for this call only
      const original = helper._file
      helper._file = copy
      try {
        return install(...args)
      } finally {
        helper._file = original
      }
    } catch (error) {
      if (privateDir != null) bestEffortRemove(privateDir)
      return refuse(`the downloaded file could not be checked: ${(error as Error).message}`)
    }
  }

  const getOrCreateDownloadHelper = internals.getOrCreateDownloadHelper.bind(internals)
  internals.getOrCreateDownloadHelper = async () => {
    const helper = await getOrCreateDownloadHelper()
    if (typeof helper.getValidCachedUpdateFile !== 'function') {
      throw new Error('electron-updater no longer exposes its update cache hook')
    }
    helper.getValidCachedUpdateFile = async () => null
    return helper
  }
}

export interface HardenOptions {
  publicKeys?: readonly string[]
  fetchSignature?: FetchSignature
}

/**
 * Applies the update-verification policy. Throws if it cannot be applied, in which case the
 * caller must not check for or install updates.
 *
 * - Every platform: sha512 of the downloaded file must match the feed (electron-updater enforces
 *   it and fails the download otherwise); downgrades and web installers are refused.
 * - Windows and Linux: the download must carry a release-key signature for the announced version
 *   (see requireSignedDownloads). No certificate authority is involved, so an expired or
 *   unrenewed code-signing certificate cannot break or weaken updates.
 * - macOS: Squirrel.Mac refuses a bundle whose code signature does not satisfy the running app's
 *   designated requirement, so nothing to configure here.
 */
export const hardenUpdater = (
  updater: AppUpdater,
  platform: NodeJS.Platform = process.platform,
  { publicKeys = UPDATE_SIGNING_PUBLIC_KEYS, fetchSignature = fetchSignatureWith(updater) }: HardenOptions = {}
) => {
  updater.allowDowngrade = false
  updater.disableWebInstaller = true
  if (platform === 'win32' || platform === 'linux') {
    requireSignedDownloads(updater, publicKeys, fetchSignature)
  }
}
