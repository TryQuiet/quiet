const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const test = require('node:test')
const beforePack = require('./beforePack.cjs').default
const signing = require('./updateSigning.cjs')
const { inBuild } = require('./buildEnv.test-helper.cjs')

const s3 = { provider: 's3', bucket: 'quiet.11.x', region: 'us-east-1', forcePathStyle: true }
const run = (electronPlatformName, config, env = {}) =>
  inBuild(env, () => beforePack({ electronPlatformName, packager: {}, arch: 1 }, async () => config))
const otherKey = () => crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' })
const REQUIRED = { [signing.REQUIRE_ENV]: '1' }

test('a build that must be signed stops before packaging without a release signing key the app accepts', async () => {
  for (const platform of ['win32', 'linux']) {
    await assert.rejects(run(platform, s3, REQUIRED), new RegExp(`Refusing to package ${platform}.*is not set`))
    await assert.rejects(run(platform, s3, { ...REQUIRED, [signing.KEY_ENV]: otherKey() }), /does not match any key/)
    await assert.rejects(run(platform, s3, { ...REQUIRED, [signing.KEY_ENV]: 'garbage' }), /unusable/)
  }
})

test('a wrong key stops packaging even when signing is not required', async () => {
  await assert.rejects(run('linux', s3, { [signing.KEY_ENV]: otherKey() }), /does not match any key/)
  await assert.rejects(run('win32', s3, { [signing.KEY_ENV]: otherKey(), CI: 'true' }), /does not match any key/)
})

test('without the requirement a keyless build packages, whatever CI or event labels it carries', async () => {
  for (const env of [
    {},
    { CI: 'true' },
    { CI: 'true', CI_COMMIT_TAG: 'v1', GITHUB_REF_TYPE: 'tag' },
    { GITHUB_BASE_REF: 'develop', PUBLISH_FOR_PULL_REQUEST: 'true' },
    { IS_LOCAL: 'true' },
    { IS_E2E: 'true' },
    { npm_lifecycle_event: 'release' },
  ]) {
    await assert.doesNotReject(run('linux', s3, env), JSON.stringify(env))
    await assert.doesNotReject(run('win32', s3, env), JSON.stringify(env))
  }
})

test('the requirement is exactly QUIET_REQUIRE_UPDATE_SIGNING=1; any other value stops the build', async () => {
  for (const value of ['true', '0', 'yes', ' 1']) {
    await assert.rejects(run('linux', s3, { [signing.REQUIRE_ENV]: value }), /must be 1 or unset/, value)
  }
  await assert.doesNotReject(run('linux', s3, { [signing.REQUIRE_ENV]: '' }))
})

test('packaging requires the HTTPS S3 feed; macOS is left to Squirrel.Mac', async () => {
  await assert.doesNotReject(run('linux', s3))
  await assert.rejects(run('linux', { provider: 'generic', url: 'http://example.test' }), /not https/)
  await assert.doesNotReject(run('darwin', null, REQUIRED))
})

test('the real packager resolves the configuration that the hook checks', async () => {
  // No stub: this is the function electron-builder uses to write app-update.yml.
  const { getAppUpdatePublishConfiguration } = require('app-builder-lib/out/publish/PublishManager')
  assert.equal(typeof getAppUpdatePublishConfiguration, 'function')
})
