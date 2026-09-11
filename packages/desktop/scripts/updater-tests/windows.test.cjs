const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { EventEmitter } = require('node:events')
const { repository } = require('./repository.cjs')
const { AuthenticatedNsisUpdater } = require('../../updater/index.cjs')
const { verifyWindowsSignature } = require('../../updater/windows-signature.cjs')
const { NodeHttpExecutor } = require('builder-util/out/nodeHttpExecutor')
const { ElectronHttpExecutor } = require('electron-updater/out/electronHttpExecutor')

test('real Windows Authenticode and NSIS download/cache/install reject unsigned, wrong-signer and tampered PE files', { skip: process.platform !== 'win32' }, async t => {
  const repo = await repository(t, 'win32')
  const script = path.join(__dirname, 'windows-fixtures.ps1')
  const powershell = path.join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe')
  const run = args => execFileSync(powershell, ['-NoProfile', '-NonInteractive', '-File', script, '-Directory', repo.directory, ...args])
  run([])
  repo.beforeCleanup.push(() => run(['-Cleanup']))
  require.cache[require.resolve('electron')] = { exports: { autoUpdater: new EventEmitter() } }
  const names = repo.trust.windowsPublisherNames
  const valid = path.join(repo.directory, 'valid.exe')
  // A caller's (for example PowerShell 7's) module path must not select verifier code.
  const previousModulePath = process.env.PSModulePath
  process.env.PSModulePath = path.join(repo.directory, 'unrelated-modules')
  try { assert.equal(await verifyWindowsSignature(names, valid), null) }
  finally { if (previousModulePath === undefined) delete process.env.PSModulePath; else process.env.PSModulePath = previousModulePath }
  for (const file of ['unsigned.exe', 'wrong.exe']) await assert.rejects(verifyWindowsSignature(names, path.join(repo.directory, file)))
  const special = path.join(repo.directory, "valid'$& update.exe")
  fs.copyFileSync(valid, special)
  assert.equal(await verifyWindowsSignature(names, special), null)
  const tampered = Buffer.from(fs.readFileSync(valid))
  tampered[512] ^= 1
  fs.writeFileSync(path.join(repo.directory, 'tampered.exe'), tampered)
  await assert.rejects(verifyWindowsSignature(names, path.join(repo.directory, 'tampered.exe')))

  const config = path.join(repo.directory, 'app-update.yml')
  fs.writeFileSync(config, require('js-yaml').dump({ publisherName: names, updaterCacheDirName: 'quiet-test' }))
  const app = { version: '1.0.0', name: 'Quiet Test', isPackaged: true, appUpdateConfigPath: config,
    userDataPath: repo.directory, baseCachePath: path.join(repo.directory, 'cache'),
    async whenReady() {}, quit() { this.quits = (this.quits || 0) + 1 }, onQuit() { throw new Error('Unexpected automatic installation') } }
  function makeUpdater() {
    const value = new AuthenticatedNsisUpdater(repo.trust, app)
    value.httpExecutor = new NodeHttpExecutor()
    value.httpExecutor.download = ElectronHttpExecutor.prototype.download
    value.disableDifferentialDownload = true
    value.logger = null
    value.errors = []
    value.on('error', error => value.errors.push(error))
    return value
  }
  for (const file of ['unsigned.exe', 'wrong.exe', 'tampered.exe']) {
    repo.publish(null, { artifact: fs.readFileSync(path.join(repo.directory, file)) })
    const value = makeUpdater()
    const result = await value.checkForUpdates()
    await assert.rejects(result.downloadPromise)
    await value.quitAndInstall(true, false)
    assert.equal(app.quits, undefined)
  }
  repo.publish(null, { artifact: fs.readFileSync(valid) })
  await (await makeUpdater().checkForUpdates()).downloadPromise
  const cached = makeUpdater()
  await (await cached.checkForUpdates()).downloadPromise
  process.env.QUIET_TEST_INSTALLED = path.join(repo.directory, 'installer-ran')
  t.after(() => delete process.env.QUIET_TEST_INSTALLED)
  await cached.quitAndInstall(true, false)
  for (let attempt = 0; attempt < 100 && !fs.existsSync(process.env.QUIET_TEST_INSTALLED); attempt++) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  assert.equal(fs.readFileSync(process.env.QUIET_TEST_INSTALLED, 'utf8'), 'installed')
  assert.equal(app.quits, 1)
})
