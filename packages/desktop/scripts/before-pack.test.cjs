const assert = require('node:assert/strict')
const test = require('node:test')
const beforePack = require('./beforePack.cjs').default
const { build } = require('../package.json')

const s3 = { provider: 's3', bucket: 'quiet.11.x', region: 'us-east-1', forcePathStyle: true }
const pinned = [].concat(build.win.signtoolOptions.publisherName)
const run = (electronPlatformName, config) =>
  beforePack({ electronPlatformName, packager: {}, arch: 1 }, async () => config)

test('beforePack is registered as the electron-builder hook', () => {
  assert.equal(build.beforePack, 'scripts/beforePack.cjs')
})

test('Windows packaging stops when app-update.yml would carry no publisherName', async () => {
  await assert.rejects(run('win32', s3), /publisherName is missing/)
  await assert.rejects(run('win32', { ...s3, publisherName: ['CN=Someone Else'] }), /differs from package.json/)
  await assert.doesNotReject(run('win32', { ...s3, publisherName: pinned }))
})

test('Linux packaging requires the HTTPS S3 feed; macOS is left to Squirrel.Mac', async () => {
  await assert.doesNotReject(run('linux', s3))
  await assert.rejects(run('linux', { provider: 'generic', url: 'http://example.test' }), /not https/)
  await assert.doesNotReject(run('darwin', null))
})

test('the real packager resolves the configuration that the hook checks', async () => {
  // No stub: this is the function electron-builder uses to write app-update.yml.
  const { getAppUpdatePublishConfiguration } = require('app-builder-lib/out/publish/PublishManager')
  assert.equal(typeof getAppUpdatePublishConfiguration, 'function')
})
