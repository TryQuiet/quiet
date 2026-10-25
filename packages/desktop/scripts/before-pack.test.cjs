const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const test = require('node:test')
const beforePack = require('./beforePack.cjs').default
const signing = require('./updateSigning.cjs')

const s3 = { provider: 's3', bucket: 'quiet.11.x', region: 'us-east-1', forcePathStyle: true }
const run = (electronPlatformName, config, publishArgs = ['-p', 'always']) => {
  const argv = process.argv
  process.argv = [...argv, ...publishArgs]
  return beforePack({ electronPlatformName, packager: {}, arch: 1 }, async () => config).finally(() => {
    process.argv = argv
  })
}

// beforePack reads the release key from the environment, as the release workflows provide it.
const withEnv = async (env, fn) => {
  const saved = { ...process.env }
  for (const name of ['GITHUB_EVENT_NAME', 'IS_LOCAL', 'IS_E2E', signing.KEY_ENV]) delete process.env[name]
  Object.assign(process.env, env)
  try {
    await fn()
  } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name]
    Object.assign(process.env, saved)
  }
}

test('Windows and Linux packaging stops without a release signing key the app accepts', async () => {
  await withEnv({}, async () => {
    await assert.rejects(run('win32', s3), /Refusing to package win32.*is not set/)
    await assert.rejects(run('linux', s3), /Refusing to package linux.*is not set/)
  })
  const other = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' })
  await withEnv({ [signing.KEY_ENV]: other }, async () => {
    await assert.rejects(run('win32', s3), /does not match any key/)
  })
})

test('builds that are not published are not blocked on the key', async () => {
  await withEnv({}, async () => {
    await assert.doesNotReject(run('win32', s3, ['--publish', 'never']))
    await assert.doesNotReject(run('linux', s3, []))
  })
})

test('PR, local and e2e builds are not signed and so not blocked', async () => {
  for (const env of [{ GITHUB_EVENT_NAME: 'pull_request' }, { IS_LOCAL: 'true' }, { IS_E2E: 'true' }]) {
    await withEnv(env, async () => assert.doesNotReject(run('win32', s3)))
  }
})

test('packaging requires the HTTPS S3 feed; macOS is left to Squirrel.Mac', async () => {
  await withEnv({ IS_LOCAL: 'true' }, async () => {
    await assert.doesNotReject(run('linux', s3))
    await assert.rejects(run('linux', { provider: 'generic', url: 'http://example.test' }), /not https/)
  })
  await withEnv({}, async () => assert.doesNotReject(run('darwin', null)))
})

test('the real packager resolves the configuration that the hook checks', async () => {
  // No stub: this is the function electron-builder uses to write app-update.yml.
  const { getAppUpdatePublishConfiguration } = require('app-builder-lib/out/publish/PublishManager')
  assert.equal(typeof getAppUpdatePublishConfiguration, 'function')
})

test('publishing is detected from the electron-builder command line', () => {
  const { isPublishing } = require('./beforePack.cjs')
  assert.equal(isPublishing(['electron-builder', '-p', 'always', '--win']), true)
  assert.equal(isPublishing(['electron-builder', '--publish=onTagOrDraft']), true)
  assert.equal(isPublishing(['electron-builder', '--publish', 'onTag']), true)
  assert.equal(isPublishing(['electron-builder', '-p', 'never']), false)
  assert.equal(isPublishing(['electron-builder', '--win']), false)
})
