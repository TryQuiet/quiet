import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { CancellationToken } from 'builder-util-runtime'
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
  downloadToBuffer(url: URL, options: { cancellationToken: CancellationToken }): Promise<Buffer>
}

// Goes through the updater's own HTTP executor so the request uses Electron's network stack, and
// with it the system proxy settings that the update download itself relies on.
const fetchSignatureWith =
  (updater: AppUpdater): FetchSignature =>
  async url => {
    const executor = (updater as unknown as { httpExecutor?: HttpExecutor }).httpExecutor
    if (executor == null) throw new Error('electron-updater has no HTTP executor')
    const cancellationToken = new CancellationToken()
    const timer = setTimeout(() => cancellationToken.cancel(), SIGNATURE_TIMEOUT_MS)
    try {
      const body = await executor.downloadToBuffer(url, { cancellationToken })
      if (body.length > MAX_SIGNATURE_BYTES) throw new Error('signature file is too large')
      return body.toString('utf8')
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

/**
 * Resolves to null when `filePath` carries a valid release-key signature for exactly this version
 * and file name, otherwise to the reason it is not acceptable. Any failure to reach a verdict
 * (no signature, unreadable file, network error) is a rejection.
 */
export const verifyUpdateSignature = async (
  download: SignedDownload,
  publicKeys: readonly string[],
  fetchSignature: FetchSignature
): Promise<string | null> => {
  if (publicKeys.length === 0) return 'no release signing key is configured'
  if (!download.version) return 'the announced update version is unknown'
  let signature: string
  try {
    signature = (await fetchSignature(download.signatureUrl)).trim()
  } catch (error) {
    return `could not fetch the signature ${download.signatureUrl.href}: ${(error as Error).message}`
  }
  if (!/^[A-Za-z0-9+/]{86}==$/.test(signature)) return 'the signature file is malformed'
  let statement: Buffer
  try {
    statement = Buffer.from(updateStatement(download.version, download.fileName, await sha512OfFile(download.filePath)))
  } catch (error) {
    return `could not hash the download: ${(error as Error).message}`
  }
  const bytes = Buffer.from(signature, 'base64')
  const valid = publicKeys.some(key => crypto.verify(null, statement, toPublicKey(key), bytes))
  return valid ? null : 'the signature does not match this version and file'
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
  if (typeof internals.executeDownload !== 'function' || typeof internals.getOrCreateDownloadHelper !== 'function') {
    throw new Error('electron-updater no longer exposes its download hooks')
  }
  if (publicKeys.length === 0) throw new Error('no update signing key is configured')
  publicKeys.forEach(toPublicKey) // throws on a malformed key

  const executeDownload = internals.executeDownload.bind(internals)
  internals.executeDownload = options => {
    const { fileInfo, downloadUpdateOptions, task } = options
    const version = downloadUpdateOptions.updateInfoAndProvider?.info?.version
    const signatureUrl = new URL(fileInfo.url.href)
    signatureUrl.pathname = `${signatureUrl.pathname}.sig`
    const fileName = path.posix.basename(decodeURIComponent(fileInfo.url.pathname))
    return executeDownload({
      ...options,
      task: async (tempFile, ...rest) => {
        await task(tempFile, ...rest)
        const problem = await verifyUpdateSignature(
          { filePath: tempFile, fileName, version, signatureUrl },
          publicKeys,
          fetchSignature
        )
        if (problem != null) {
          throw new Error(`New version ${version} is not signed by the Quiet release key: ${problem}`)
        }
      },
    })
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
