const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
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

test('a build with S3 publishing credentials must be signed even without the flag', async () => {
  for (const name of signing.PUBLISH_CREDENTIAL_ENV) {
    await assert.rejects(
      run('linux', s3, { [name]: 'x' }),
      new RegExp(`is not set.*signing is required: ${name} is set`),
      name
    )
  }
  // electron-publish reads these from the default location whatever the override variables say
  for (const name of ['credentials', 'config']) {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'aws-home-'))
    try {
      fs.mkdirSync(path.join(home, '.aws'))
      fs.writeFileSync(path.join(home, '.aws', name), '[default]\n')
      for (const override of [{}, { AWS_SHARED_CREDENTIALS_FILE: '/nonexistent', AWS_CONFIG_FILE: '/nonexistent' }]) {
        await assert.rejects(
          run('win32', s3, { HOME: home, USERPROFILE: home, ...override }),
          /signing is required/,
          `${name} ${JSON.stringify(override)}`
        )
      }
    } finally {
      fs.rmSync(home, { recursive: true, force: true })
    }
  }
})

// Differential check against the publisher electron-builder actually uses: whenever it would find credentials,
// the gate must require signing. (Only this test reads the publisher's internals; the gate itself does not.)
test('signing is required whenever the locked S3 publisher would find credentials', async () => {
  const { resolveAwsCredentials } = require('electron-publish/out/s3/awsCredentials')
  const { RequestSigner } = require('aws4')
  const publisherFinds = () =>
    Boolean(resolveAwsCredentials()?.accessKeyId || RequestSigner.prototype.defaultCredentials().accessKeyId)
  const withCredentialsFile = (name, env) => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'aws-home-'))
    fs.mkdirSync(path.join(home, '.aws'))
    fs.writeFileSync(path.join(home, '.aws', name), '[default]\naws_access_key_id = AKIA\naws_secret_access_key = s\n')
    return { HOME: home, USERPROFILE: home, ...env }
  }
  const setups = [
    { AWS_ACCESS_KEY_ID: 'AKIA', AWS_SECRET_ACCESS_KEY: 's' },
    { AWS_ACCESS_KEY: 'AKIA', AWS_SECRET_KEY: 's' }, // aws4's fallback
    { AWS_ACCESS_KEY_ID: 'AKIA' },
    { AWS_ACCESS_KEY: 'AKIA' },
    withCredentialsFile('credentials', {}),
    withCredentialsFile('credentials', { AWS_SHARED_CREDENTIALS_FILE: '/nonexistent', AWS_PROFILE: 'default' }),
  ]
  let found = 0
  for (const env of setups) {
    await inBuild(env, async () => {
      if (!publisherFinds()) return
      found++
      assert.ok(signing.signingRequired(), JSON.stringify(Object.keys(env)))
    })
    if (env.HOME) fs.rmSync(env.HOME, { recursive: true, force: true })
  }
  assert.ok(found >= 5, `the publisher found credentials in only ${found} setups; the check would prove nothing`)
  // and a clean build environment gives the publisher nothing, so keyless local builds stay possible
  await inBuild({}, async () => {
    assert.equal(publisherFinds(), false)
    assert.equal(signing.signingRequired(), false)
  })
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
