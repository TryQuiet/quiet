const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { AppUpdater, AppImageUpdater, NsisUpdater } = require('electron-updater')
const { load } = require('js-yaml')
const { TufProvider } = require('./tuf-provider.cjs')
const { readTrust, publisherNames, subjectsEqual } = require('./trust.cjs')
const { verifyWindowsSignature } = require('./windows-signature.cjs')

function verifyArtifact(file, info) {
  if (!fs.lstatSync(file).isFile()) throw new Error('Update artifact must be a regular file, not a link')
  const expected = info.files[0]
  const fd = fs.openSync(file, 'r')
  try {
    if (fs.fstatSync(fd).size !== expected.size) throw new Error('Update artifact size changed')
    const hash = createHash('sha512')
    const buffer = Buffer.alloc(1024 * 1024)
    let count
    while ((count = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, count))
    if (hash.digest('base64') !== expected.sha512) throw new Error('Update artifact digest changed')
  } finally { fs.closeSync(fd) }
}

function authenticatedUpdater(Base, platform) {
  return class extends Base {
    constructor(options, app) {
      super(null, app)
      this.trustOptions = options
      this.autoInstallOnAppQuit = false
      this.disableWebInstaller = true
      this.approved = null
      this.installAuthorized = false
      // Standard Windows trust validation, with errors always rejecting.
      if (platform === 'win32') this.verifyUpdateCodeSignature = verifyWindowsSignature
    }

    async checkForUpdates() {
      if (!this.trust) {
        const trust = this.trustOptions || readTrust(process.resourcesPath)
        if (platform === 'win32') {
          const configured = publisherNames(load(fs.readFileSync(this.app.appUpdateConfigPath, 'utf8')).publisherName)
          const approved = publisherNames(trust.windowsPublisherNames)
          if (configured.length !== approved.length || !configured.every(name => approved.some(value => subjectsEqual(name, value)))) {
            throw new Error('Installed Windows updater publisher configuration does not match approved trust')
          }
        }
        this.setFeedURL({ ...trust, cachePath: path.join(this.app.userDataPath, 'trusted-updates'),
          provider: 'custom', updateProvider: TufProvider })
        this.trust = trust
        this.allowDowngrade = false
      }
      return super.checkForUpdates()
    }

    async executeDownload(taskOptions) {
      this.approved = null
      const { info, provider } = taskOptions.downloadUpdateOptions.updateInfoAndProvider
      if (!(provider instanceof TufProvider)) throw new Error('An authenticated update provider is required')
      provider.resolveFiles(info)
      // BaseUpdater replaces the completion hook. Use its parent's protected
      // download executor so both fresh and cached files pass our gate BEFORE
      // update-downloaded, with no automatic quit handler registered.
      return AppUpdater.prototype.executeDownload.call(this, { ...taskOptions, done: async event => {
        verifyArtifact(event.downloadedFile, info)
        if (platform === 'win32') await verifyWindowsSignature(this.trust.windowsPublisherNames, event.downloadedFile)
        this.approved = { file: event.downloadedFile, info, provider }
        this.dispatchUpdateDownloaded(event)
      } })
    }

    async quitAndInstall(isSilent = false, isForceRunAfter = false) {
      try {
        if (!this.approved) throw new Error('No authenticated update is ready to install')
        const approved = this.approved
        await approved.provider.reauthorize(approved.info)
        verifyArtifact(approved.file, approved.info)
        if (platform === 'win32') await verifyWindowsSignature(this.trust.windowsPublisherNames, approved.file)
        if (this.approved !== approved) throw new Error('Update changed while authorizing installation')
        this.installAuthorized = true
        super.quitAndInstall(isSilent, isForceRunAfter)
      } catch (error) { this.dispatchError(error) }
      finally { this.installAuthorized = false }
    }

    install(isSilent = false, isForceRunAfter = false) {
      if (!this.installAuthorized || !this.approved || this.installerPath !== this.approved.file) {
        this.dispatchError(new Error('Update installation has not been authorized'))
        return false
      }
      const cache = fs.realpathSync(this.downloadedUpdateHelper.cacheDirForPendingUpdate)
      if (path.dirname(fs.realpathSync(this.installerPath)) !== cache) {
        this.dispatchError(new Error('Update artifact escaped the pending update cache'))
        return false
      }
      // Recheck bytes at the synchronous install boundary, including cache hits.
      try { verifyArtifact(this.installerPath, this.approved.info) }
      catch (error) { this.dispatchError(error); return false }
      return super.install(isSilent, isForceRunAfter)
    }
  }
}

const AuthenticatedAppImageUpdater = authenticatedUpdater(AppImageUpdater, 'linux')
const AuthenticatedNsisUpdater = authenticatedUpdater(NsisUpdater, 'win32')

function createUpdater() {
  if (process.platform === 'linux') return new AuthenticatedAppImageUpdater()
  if (process.platform === 'win32') return new AuthenticatedNsisUpdater()
  return require('electron-updater').autoUpdater
}

module.exports = { createUpdater, AuthenticatedAppImageUpdater, AuthenticatedNsisUpdater, verifyArtifact }
