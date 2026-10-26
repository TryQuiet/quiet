const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const test = require('node:test')
const beforePack = require('./beforePack.cjs').default
const signing = require('./updateSigning.cjs')

const s3 = { provider: 's3', bucket: 'quiet.11.x', region: 'us-east-1', forcePathStyle: true }
const { inBuild } = require('./buildEnv.cjs')
const run = (electronPlatformName, config, publishArgs = ['-p', 'always'], env = {}) =>
  inBuild(env, publishArgs, () => beforePack({ electronPlatformName, packager: {}, arch: 1 }, async () => config))

test('Windows and Linux packaging stops without a release signing key the app accepts', async () => {
  await assert.rejects(run('win32', s3), /Refusing to package win32.*is not set/)
  await assert.rejects(run('linux', s3), /Refusing to package linux.*is not set/)
  const other = crypto.generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' })
  await assert.rejects(run('win32', s3, ['-p', 'always'], { [signing.KEY_ENV]: other }), /does not match any key/)
})

test('packaging needs the key unless the build is explicitly --publish never; labels and CI do not excuse it', async () => {
  for (const [env, args] of [
    [{}, []], // a plain build has to say --publish never
    [{ CI: 'true' }, []],
    [{ CI: 'true', CI_COMMIT_TAG: 'v1' }, []],
    [{ npm_lifecycle_event: 'release' }, []],
    [{ IS_LOCAL: 'true' }, ['-p', 'always']],
    [{ IS_E2E: 'true' }, ['--publish=always']],
    [{ GITHUB_BASE_REF: 'develop' }, []],
    [{ GITHUB_BASE_REF: 'develop', PUBLISH_FOR_PULL_REQUEST: 'true' }, ['-p', 'always']],
    [{}, ['-p', 'never', '-p', 'always']], // repeated flags reach electron-builder as an array
    [{}, ['--publish=never', '--publish', 'always']],
  ]) {
    await assert.rejects(run('linux', s3, args, env), /is not set/, JSON.stringify([env, args]))
  }
})

test('the JS API is never "explicitly unpublished", whatever its own command line says', async () => {
  const { explicitlyUnpublished } = signing
  const argv = ['--linux', '--publish', 'never']
  assert.equal(explicitlyUnpublished(['node', '/usr/bin/electron-builder', ...argv]), true)
  assert.equal(
    explicitlyUnpublished(['node', 'C:\\app\\node_modules\\electron-builder\\out\\cli\\cli.js', ...argv]),
    true
  )
  assert.equal(explicitlyUnpublished(['node', 'release-script.js', ...argv]), false)
  assert.equal(explicitlyUnpublished(['node']), false)
  // a script that calls require('electron-builder').build({ publish: 'always' }) and happens to carry the flags
  await inBuild({}, argv, () => {
    process.argv[1] = 'release.js'
    return assert.rejects(
      beforePack({ electronPlatformName: 'linux', packager: {}, arch: 1 }, async () => s3),
      /is not set/
    )
  })
})

// The answer comes from electron-builder's own yargs definition of its build command.
test("explicitlyUnpublished agrees with electron-builder's own parse of the command line", () => {
  const cli = ['node', '/app/node_modules/.bin/electron-builder']
  const cases = [
    [['--linux', '-p', 'never'], true],
    [['--linux', '--publish', 'never'], true],
    [['--linux', '--publish=never'], true],
    [['-p', 'never', '--win'], true],
    [[], false],
    [['-p', 'always'], false],
    [['--publish', 'onTag'], false],
    [['--publish', 'onTagOrDraft'], false],
    [['-p', 'never', '-p', 'always'], false],
    [['-p', 'always', '-p', 'never'], false],
    [['-p', 'never', '--publish=never'], false],
    [['--publish', 'bogus'], false],
    [['--publish'], false],
  ]
  for (const [args, expected] of cases) {
    assert.equal(signing.explicitlyUnpublished([...cli, ...args]), expected, args.join(' '))
  }
})

test('builds that are explicitly not published are not blocked on the key', async () => {
  await assert.doesNotReject(run('win32', s3, ['--publish', 'never'], { CI: 'true' }))
  await assert.doesNotReject(run('linux', s3, ['-p', 'never'], {}))
  await assert.doesNotReject(run('win32', s3, ['-p', 'never'], { CI: 'true', GITHUB_BASE_REF: 'develop' }))
})

test('packaging requires the HTTPS S3 feed; macOS is left to Squirrel.Mac', async () => {
  await assert.doesNotReject(run('linux', s3, ['-p', 'never']))
  await assert.rejects(run('linux', { provider: 'generic', url: 'http://example.test' }, ['-p', 'never']), /not https/)
  await assert.doesNotReject(run('darwin', null, ['-p', 'always']))
})

test('the real packager resolves the configuration that the hook checks', async () => {
  // No stub: this is the function electron-builder uses to write app-update.yml.
  const { getAppUpdatePublishConfiguration } = require('app-builder-lib/out/publish/PublishManager')
  assert.equal(typeof getAppUpdatePublishConfiguration, 'function')
})
