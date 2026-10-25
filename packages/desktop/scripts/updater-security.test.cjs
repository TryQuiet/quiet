const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const semver = require('semver')
const { build, dependencies } = require('../package.json')
const lock = require('../package-lock.json')
const { problems } = require('./verifyUpdateConfig.cjs')

const pinnedPublishers = [].concat(build.win.signtoolOptions.publisherName)

test('electron-updater is past the Windows signature-verification bypass (CVE-2024-39698, fixed in 6.3.0)', () => {
  const locked = lock.packages['node_modules/electron-updater'].version
  assert.ok(semver.gte(locked, '6.3.0'), `locked electron-updater ${locked}`)
  assert.ok(semver.gte(semver.minVersion(dependencies['electron-updater']), '6.3.0'), dependencies['electron-updater'])
})

test('Windows builds pin the publisher with a full DN and keep signature verification on', () => {
  assert.notEqual(build.win.verifyUpdateCodeSignature, false)
  assert.ok(pinnedPublishers.length > 0)
  for (const dn of pinnedPublishers) {
    // A bare name would be matched on CN alone by electron-updater.
    assert.match(dn, /^CN=[^,]+(, [A-Z]+=[^,]+)+$/, dn)
  }
})

test('the pin in package.json is the one compiled into the app', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/main/updaterSecurity.ts'), 'utf8')
  const compiled = /WINDOWS_PUBLISHER_NAMES: readonly string\[\] = (\[.*\])/.exec(source)
  assert.ok(compiled, 'WINDOWS_PUBLISHER_NAMES not found')
  assert.deepEqual(JSON.parse(compiled[1].replace(/'/g, '"')), pinnedPublishers)
})

test('the update feed is an HTTPS S3 bucket', () => {
  assert.equal(build.publish.provider, 's3')
  assert.equal(build.publish.endpoint, undefined)
})

test('verifyUpdateConfig flags a Windows app-update.yml that would skip the signature check', () => {
  const s3 = { provider: 's3', bucket: 'quiet.11.x', region: 'us-east-1', forcePathStyle: true }
  assert.deepEqual(problems({ ...s3, publisherName: pinnedPublishers }, 'win'), [])
  assert.match(problems(s3, 'win').join('\n'), /publisherName is missing/)
  assert.match(problems({ ...s3, publisherName: ['CN=Someone Else'] }, 'win').join('\n'), /differs from package.json/)
  assert.deepEqual(problems(s3, 'other'), [])
  assert.match(problems({ provider: 'generic', url: 'http://example.test' }, 'other').join('\n'), /not https/)
})
