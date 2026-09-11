const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { Updater, BaseFetcher } = require('tuf-js')
const { DownloadHTTPError } = require('tuf-js/dist/error')
const { valid, prerelease } = require('semver')
const { Provider, parseUpdateInfo, resolveFiles } = require('electron-updater/out/providers/Provider')

class FixedOriginFetcher extends BaseFetcher {
  async fetch(url) {
    // No redirects, credentials, or ambient authorization headers for metadata.
    // BaseFetcher enforces TUF's signed and configured response size bounds.
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new DownloadHTTPError(`TUF request returned HTTP ${response.status}`, response.status)
    if (!response.body) throw new Error('Empty TUF response')
    return response.body
  }
}

class TufProvider extends Provider {
  constructor(config, updater, runtimeOptions) {
    // S3 supports individual ranges, not multipart byte-range requests.
    super({ ...runtimeOptions, isUseMultipleRangeRequest: false })
    this.config = config
    this.targetName = `${runtimeOptions.platform}/${process.arch}/${config.channel}.yml`
    this.authorized = new WeakSet()
    const namespace = createHash('sha256').update(config.metadataBaseUrl).digest('hex')
    this.cache = path.join(config.cachePath, namespace)
    fs.mkdirSync(this.cache, { recursive: true, mode: 0o700 })
    // The application ships the bootstrap root. Preserve trusted rotations and
    // rollback state across restarts; never recover from errors by resetting it.
    const root = fs.readFileSync(config.rootPath)
    try { fs.writeFileSync(path.join(this.cache, 'root.json'), root, { flag: 'wx', mode: 0o600 }) }
    catch (error) { if (error.code !== 'EEXIST') throw error }
  }

  getLatestVersion() {
    // Checks and install-time refreshes share persistent TUF state.
    const next = (this.pending || Promise.resolve()).catch(() => {}).then(() => this.loadLatestVersion())
    this.pending = next
    return next
  }

  async loadLatestVersion() {
    // A new client refreshes online timestamp/expiry on every check and install.
    const client = new Updater({ metadataDir: this.cache, metadataBaseUrl: this.config.metadataBaseUrl,
      targetBaseUrl: this.config.targetBaseUrl, targetDir: this.cache,
      fetcher: new FixedOriginFetcher(),
      config: { fetchTimeout: 15_000, fetchRetries: 1, maxRootRotations: 100 } })
    const target = await client.getTargetInfo(this.targetName)
    if (!target || target.length > 1024 * 1024) throw new Error('No authorized update manifest for this platform, architecture and channel')
    const downloaded = await client.downloadTarget(target)
    const bytes = fs.readFileSync(downloaded)
    // Verify the same bytes we parse, including when a cached file is replaced.
    await target.verify(require('node:stream').Readable.from([bytes]))
    const info = parseUpdateInfo(bytes.toString('utf8'), this.targetName, new URL(this.targetName, this.config.targetBaseUrl))
    if (!info || typeof info.version !== 'string' || !valid(info.version) || !Array.isArray(info.files) || info.files.length !== 1 || info.packages) {
      throw new Error('Expected one complete, versioned update artifact')
    }
    const pre = prerelease(info.version)
    if (this.config.channel === 'latest' ? pre !== null : pre?.[0] !== this.config.channel) {
      throw new Error('Update version is from a different channel')
    }
    const file = info.files[0]
    const extension = this.targetName.startsWith('linux/') ? '.AppImage' : '.exe'
    if (typeof file.url !== 'string' || path.posix.basename(file.url) !== file.url ||
        /[\\?#:\u0000]/.test(file.url) || !file.url.endsWith(extension) ||
        !/^[A-Za-z0-9+/]{86}==$/.test(file.sha512) || !Number.isSafeInteger(file.size) || file.size <= 0) {
      throw new Error('Invalid authorized update artifact')
    }
    Object.freeze(file)
    Object.freeze(info.files)
    Object.freeze(info)
    this.authorized.add(info)
    this.verifiedManifest = Buffer.from(bytes)
    return info
  }

  resolveFiles(info) {
    if (!this.authorized.has(info)) throw new Error('Update manifest has not been authenticated')
    return resolveFiles(info, new URL(this.config.artifactBaseUrl))
  }

  async reauthorize(info) {
    if (!this.authorized.has(info)) throw new Error('Update manifest has not been authenticated')
    const fresh = await this.getLatestVersion()
    if (fresh.version !== info.version || JSON.stringify(fresh.files) !== JSON.stringify(info.files)) {
      throw new Error('The authorized update changed; check for updates again')
    }
  }
}

module.exports = { TufProvider }
