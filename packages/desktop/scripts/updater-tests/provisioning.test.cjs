const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { configureUpdateTrust } = require('../configureUpdateTrust.cjs')
const { buildTrust } = require('../updateTrust.cjs')
const { repository, encode } = require('./repository.cjs')

const digest = bytes => createHash('sha256').update(bytes).digest('hex')

async function setup(t) {
  const repo = await repository(t)
  const projectDir = path.join(repo.directory, 'desktop')
  fs.mkdirSync(path.join(projectDir, 'build'), { recursive: true })
  const original = JSON.stringify({
    windowsPublisherNames: repo.trust.windowsPublisherNames,
    repositories: { latest: null, alpha: null },
  })
  fs.writeFileSync(path.join(projectDir, 'build/update-trust.json'), original)
  const options = {
    projectDir,
    rootPath: repo.trust.rootPath,
    sha256: digest(fs.readFileSync(repo.trust.rootPath)),
    metadataBaseUrl: 'https://example.com/quiet/metadata/',
    targetBaseUrl: 'https://example.com/quiet/targets/',
  }
  return { repo, projectDir, original, options }
}

test('provisions a reviewed P-256 root that passes the actual production packaging gate for both channels', async t => {
  const { repo, projectDir, options } = await setup(t)
  configureUpdateTrust(options)
  for (const [version, channel, bucket] of [
    ['1.0.0', 'latest', 'quiet.9.x'],
    ['1.0.0-alpha.0', 'alpha', 'test.quiet'],
  ]) {
    const built = buildTrust(projectDir, version, 'win32')
    assert.deepEqual(fs.readFileSync(built.rootPath), fs.readFileSync(repo.trust.rootPath))
    assert.equal(built.trust.channel, channel)
    assert.equal(built.trust.metadataBaseUrl, options.metadataBaseUrl)
    assert.equal(built.trust.artifactBaseUrl, `https://s3.amazonaws.com/${bucket}/`)
  }
  const existing = fs.readFileSync(path.join(projectDir, 'build/update-trust.json'))
  assert.throws(() => configureUpdateTrust(options), /already has trust/)
  assert.deepEqual(fs.readFileSync(path.join(projectDir, 'build/update-trust.json')), existing)
})

for (const failure of ['fingerprint', 'signature', 'expiry', 'http', 'credentials']) {
  test(`rejects ${failure} before writing any production trust`, async t => {
    const { repo, projectDir, original, options } = await setup(t)
    if (failure === 'fingerprint') options.sha256 = '0'.repeat(64)
    if (failure === 'signature' || failure === 'expiry') {
      repo.root.signed.expires = failure === 'expiry' ? '2000-01-01T00:00:00Z' : '2099-01-01T00:00:00Z'
      if (failure === 'expiry') repo.root.sign(data => repo.key.sign(data))
      fs.writeFileSync(repo.trust.rootPath, encode(repo.root))
      options.sha256 = digest(fs.readFileSync(repo.trust.rootPath))
    }
    if (failure === 'http') options.metadataBaseUrl = 'http://example.com/metadata/'
    if (failure === 'credentials') options.targetBaseUrl = 'https://user:password@example.com/targets/'
    assert.throws(() => configureUpdateTrust(options))
    assert.equal(fs.readFileSync(path.join(projectDir, 'build/update-trust.json'), 'utf8'), original)
    assert.equal(fs.existsSync(path.join(projectDir, 'build/update-trust')), false)
  })
}
