const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const { httpExecutor } = require('builder-util')
httpExecutor.download = require('electron-updater/out/electronHttpExecutor').ElectronHttpExecutor.prototype.download
const { AuthenticatedAppImageUpdater, AuthenticatedNsisUpdater } = require('../../updater/index.cjs')
const { repository, KeyPair, encode, expires } = require('./repository.cjs')
const { publisherNames } = require('../../updater/trust.cjs')

// Only the app adapter and Electron's final quit notification are replaced.
// Provider, HTTP transfer, TUF crypto, cache and AppImage install are real.
require.cache[require.resolve('electron')] = { exports: { autoUpdater: new EventEmitter() } }

function updater(repo, platform = 'linux') {
  const configPath = path.join(repo.directory, 'app-update.yml')
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, 'updaterCacheDirName: quiet-test\n')
  const app = { version: '1.0.0', name: 'Quiet Test', isPackaged: true, appUpdateConfigPath: configPath,
    userDataPath: repo.directory, baseCachePath: path.join(repo.directory, 'cache'),
    async whenReady() {}, quit() { this.quits = (this.quits || 0) + 1 }, onQuit() { throw new Error('Automatic quit hook must stay disabled') } }
  const value = platform === 'linux' ? new AuthenticatedAppImageUpdater(repo.trust, app) : new AuthenticatedNsisUpdater(repo.trust, app)
  value.httpExecutor = httpExecutor
  value._testOnlyOptions = { platform }
  value.disableDifferentialDownload = true
  value.logger = null
  value.errors = []
  value.on('error', error => value.errors.push(error))
  value.downloads = []
  value.on('update-downloaded', event => value.downloads.push(event))
  return value
}

async function setup(t) {
  const repo = await repository(t)
  const oldImage = path.join(repo.directory, 'Quiet.AppImage')
  fs.writeFileSync(oldImage, '#!/bin/sh\nexit 0\n', { mode: 0o755 })
  const previous = { APPIMAGE: process.env.APPIMAGE, QUIET_TEST_INSTALLED: process.env.QUIET_TEST_INSTALLED }
  process.env.APPIMAGE = oldImage
  process.env.QUIET_TEST_INSTALLED = path.join(repo.directory, 'installed')
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })
  return { ...repo, oldImage }
}

async function download(value) {
  const result = await value.checkForUpdates()
  if (result?.downloadPromise) await result.downloadPromise
  return result
}

test('authenticates exact signed YAML, downloads, replaces and runs the real AppImage install path', async t => {
  const repo = await setup(t)
  repo.publish()
  // A mutable legacy channel is deliberately malicious and never requested.
  repo.objects.set('/artifacts/latest-linux.yml', Buffer.from('version: 999.0.0\n'))
  const value = updater(repo)
  await download(value)
  assert.equal(value.downloads.length, 1)
  assert.equal(value.install(), false)
  await value.quitAndInstall(true, false)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(fs.readFileSync(path.join(repo.directory, 'installed'), 'utf8'), 'installed')
  assert.equal(value.app.quits, 1)
  assert(!repo.requests.includes('/artifacts/latest-linux.yml'))
})

for (const scenario of ['missing-signature', 'wrong-key', 'missing-target', 'tampered-manifest', 'tampered-artifact', 'expired', 'wrong-platform', 'wrong-architecture', 'wrong-channel']) {
  test(`rejects ${scenario} before announcing or installing an update`, async t => {
    const repo = await setup(t)
    const options = {}
    if (scenario === 'wrong-key') options.signingKey = new KeyPair()
    if (scenario === 'expired') options.expires = new Date(Date.now() - 60_000).toISOString()
    if (scenario === 'wrong-platform') options.targetName = `win32/${process.arch}/latest.yml`
    if (scenario === 'wrong-architecture') options.targetName = 'linux/other/latest.yml'
    if (scenario === 'wrong-channel') options.info = { version: '2.0.0-alpha.0' }
    const published = repo.publish(null, options)
    if (scenario === 'missing-signature') {
      const timestamp = JSON.parse(repo.objects.get('/metadata/timestamp.json'))
      timestamp.signatures = []
      repo.objects.set('/metadata/timestamp.json', Buffer.from(JSON.stringify(timestamp)))
    }
    if (scenario === 'missing-target') repo.objects.delete(`/targets/${repo.targetName}`)
    if (scenario === 'tampered-manifest') repo.objects.set(`/targets/${repo.targetName}`, Buffer.from('version: 999.0.0\n'))
    if (scenario === 'tampered-artifact') repo.objects.set(`/artifacts/${published.artifactName}`, Buffer.from('malicious'))
    const value = updater(repo)
    await assert.rejects(download(value))
    await value.quitAndInstall(true, false)
    assert.equal(value.downloads.length, 0)
    assert.equal(value.app.quits, undefined)
    assert(fs.existsSync(repo.oldImage))
  })
}

test('missing bootstrap trust is rejected repeatedly even after initialization fails', async t => {
  const repo = await setup(t)
  repo.publish()
  fs.unlinkSync(repo.trust.rootPath)
  const value = updater(repo)
  await assert.rejects(download(value))
  await assert.rejects(download(value))
  assert.equal(repo.requests.length, 0)
})

test('restart reauthenticates metadata before accepting the existing pending download', async t => {
  const repo = await setup(t)
  repo.publish()
  await download(updater(repo))
  const artifactRequests = repo.requests.filter(name => name.startsWith('/artifacts/')).length
  const restarted = updater(repo)
  await download(restarted)
  assert.equal(restarted.downloads.length, 1)
  assert.equal(repo.requests.filter(name => name.startsWith('/artifacts/')).length, artifactRequests)
  repo.objects.delete('/metadata/timestamp.json')
  await assert.rejects(download(updater(repo)))
})

test('cached metadata cannot roll back after restart', async t => {
  const repo = await setup(t)
  repo.publish()
  const stale = new Map(repo.objects)
  repo.publish()
  await download(updater(repo))
  repo.objects.clear()
  for (const [name, value] of stale) repo.objects.set(name, value)
  await assert.rejects(download(updater(repo)))
})

for (const scenario of ['replaced-file', 'symlink', 'expired-at-install', 'removed-authority', 'new-release']) {
  test(`install gate rejects ${scenario} and keeps the current application`, async t => {
    const repo = await setup(t)
    repo.publish()
    const value = updater(repo)
    await download(value)
    const file = value.downloads[0].downloadedFile
    if (scenario === 'replaced-file') fs.writeFileSync(file, '#!/bin/sh\nexit 99\n')
    if (scenario === 'symlink') {
      const replacement = path.join(repo.directory, 'replacement')
      fs.copyFileSync(file, replacement)
      fs.unlinkSync(file)
      fs.symlinkSync(replacement, file)
    }
    if (scenario === 'expired-at-install') repo.publish(null, { expires: new Date(Date.now() - 1000).toISOString() })
    if (scenario === 'removed-authority') repo.objects.delete('/metadata/timestamp.json')
    if (scenario === 'new-release') repo.publish(null, { info: { version: '3.0.0' } })
    await value.quitAndInstall(true, false)
    assert.equal(value.app.quits, undefined)
    assert(fs.existsSync(repo.oldImage))
    assert(value.errors.length > 0)
  })
}

test('sequential root rotation preserves the new root across restarts', async t => {
  const repo = await setup(t)
  repo.publish()
  const next = new KeyPair()
  repo.root.signed.version = 2
  repo.root.signed.roles.root.keyIDs = [next.publicKey.keyID]
  repo.root.signed.addKey(next.publicKey, 'root')
  repo.root.sign(data => repo.key.sign(data))
  repo.root.sign(data => next.sign(data), true)
  repo.objects.set('/metadata/2.root.json', encode(repo.root))
  const value = updater(repo)
  await download(value)
  const rootFile = path.join(value.approved.provider.cache, 'root.json')
  assert.equal(JSON.parse(fs.readFileSync(rootFile)).signed.version, 2)
  await download(updater(repo))
  assert.equal(JSON.parse(fs.readFileSync(rootFile)).signed.version, 2)
})

test('Windows missing, empty or mismatched installed publisher fails before any HTTP request', async t => {
  const repo = await repository(t, 'win32')
  repo.publish()
  for (const publisher of [undefined, '', [], ['CN=Someone Else, O=Someone Else']]) {
    fs.writeFileSync(path.join(repo.directory, 'app-update.yml'), require('js-yaml').dump({ publisherName: publisher }))
    const value = updater(repo, 'win32')
    await assert.rejects(download(value))
    await assert.rejects(download(value))
  }
  assert.equal(repo.requests.length, 0)
  for (const names of [undefined, [], '', ['Quiet'], ['CN=Quiet']]) assert.throws(() => publisherNames(names))
})

test('differential AppImage reconstruction verifies the authenticated final bytes', async t => {
  const repo = await setup(t)
  const { appendBlockmap } = require('app-builder-lib/out/targets/differentialUpdateInfoBuilder')
  const old = Buffer.concat([Buffer.from('#!/bin/sh\nexit 0\n'), require('node:crypto').randomBytes(300_000)])
  fs.writeFileSync(repo.oldImage, old)
  await appendBlockmap(repo.oldImage)
  const updated = Buffer.from(old)
  updated.fill(42, 100_000, 110_000)
  const nextPath = path.join(repo.directory, 'next.AppImage')
  fs.writeFileSync(nextPath, updated)
  const blockmap = await appendBlockmap(nextPath)
  const artifact = fs.readFileSync(nextPath)
  repo.publish(null, { artifact, info: { files: [{ url: 'Quiet-2.0.0.AppImage', size: artifact.length,
    sha512: require('node:crypto').createHash('sha512').update(artifact).digest('base64'), blockMapSize: blockmap.blockMapSize }] } })
  const value = updater(repo)
  value.disableDifferentialDownload = false
  await download(value)
  assert(repo.ranges.length > 0, 'the real differential downloader should request byte ranges')
  assert.equal(repo.fullArtifactRequests.length, 0, 'differential reconstruction must succeed without falling back to a full download')
  assert.deepEqual(fs.readFileSync(value.downloads[0].downloadedFile), artifact)
})

test('metadata redirects are rejected, even to an otherwise valid repository', async t => {
  const repo = await setup(t)
  repo.publish()
  repo.objects.set('/redirected-timestamp', repo.objects.get('/metadata/timestamp.json'))
  repo.objects.set('/metadata/timestamp.json', { redirect: `${repo.base}redirected-timestamp` })
  await assert.rejects(download(updater(repo)))
  assert(!repo.requests.includes('/redirected-timestamp'))
})

test('a root rotation without the old root threshold is rejected', async t => {
  const repo = await setup(t)
  repo.publish()
  const next = new KeyPair()
  repo.root.signed.version = 2
  repo.root.signed.roles.root.keyIDs = [next.publicKey.keyID]
  repo.root.signed.addKey(next.publicKey, 'root')
  repo.root.sign(data => next.sign(data))
  repo.objects.set('/metadata/2.root.json', encode(repo.root))
  await assert.rejects(download(updater(repo)))
})
