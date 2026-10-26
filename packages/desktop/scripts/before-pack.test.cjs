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

test('implicit publishing and event labels do not skip the key requirement', async () => {
  for (const [env, args] of [
    [{ CI: 'true' }, []], // electron-builder publishes onTagOrDraft in CI
    [{ CI: 'true', CI_COMMIT_TAG: 'v1' }, []],
    [{ npm_lifecycle_event: 'release' }, []],
    [{ IS_LOCAL: 'true' }, ['-p', 'always']],
    [{ IS_E2E: 'true' }, ['--publish=always']],
    [{ GITHUB_BASE_REF: 'develop', PUBLISH_FOR_PULL_REQUEST: 'true' }, ['-p', 'always']],
  ]) {
    await assert.rejects(run('linux', s3, args, env), /is not set/, JSON.stringify([env, args]))
  }
})

test('builds that are not published are not blocked on the key', async () => {
  await assert.doesNotReject(run('win32', s3, ['--publish', 'never'], { CI: 'true' }))
  await assert.doesNotReject(run('linux', s3, [], {}))
  // electron-builder does not publish pull request builds, so there is nothing to sign
  await assert.doesNotReject(run('win32', s3, ['-p', 'always'], { CI: 'true', GITHUB_BASE_REF: 'develop' }))
})

test('packaging requires the HTTPS S3 feed; macOS is left to Squirrel.Mac', async () => {
  await assert.doesNotReject(run('linux', s3, []))
  await assert.rejects(run('linux', { provider: 'generic', url: 'http://example.test' }, []), /not https/)
  await assert.doesNotReject(run('darwin', null, ['-p', 'always']))
})

test('the real packager resolves the configuration that the hook checks', async () => {
  // No stub: this is the function electron-builder uses to write app-update.yml.
  const { getAppUpdatePublishConfiguration } = require('app-builder-lib/out/publish/PublishManager')
  assert.equal(typeof getAppUpdatePublishConfiguration, 'function')
})

// willPublish must agree with electron-builder's own decision. This runs the real PublishManager in a
// child process for each environment (it reads the environment when it is loaded).
test("willPublish makes the same decision as electron-builder's PublishManager", () => {
  const { spawnSync } = require('node:child_process')
  const child = `
    const { PublishManager } = require('app-builder-lib')
    const { CancellationToken } = require('builder-util-runtime')
    const { willPublish } = require('./updateSigning.cjs')
    const argv = JSON.parse(process.env.TEST_ARGV)
    const i = argv.findIndex(a => a === '-p' || a === '--publish' || /^(-p|--publish)=/.test(a))
    const publish = i < 0 ? undefined : /^(-p|--publish)=(.+)$/.exec(argv[i])?.[2] ?? argv[i + 1]
    const real = new PublishManager({ cancellationToken: new CancellationToken(), onAfterPack() {}, onArtifactCreated() {} }, { publish }).isPublish
    process.stderr.write('RESULT ' + JSON.stringify({ real, mine: willPublish(['electron-builder', ...argv]) }))`
  const cases = [
    [{}, []],
    [{}, ['-p', 'always']],
    [{}, ['--publish=always']],
    [{}, ['-p', 'never']],
    [{}, ['--publish', 'onTag']],
    [{}, ['--publish', 'onTagOrDraft']],
    [{ CI: 'true' }, []],
    [{ CI: 'true' }, ['-p', 'never']],
    [{ CI: 'true' }, ['--publish', 'onTag']],
    [{ CI: 'true', CI_COMMIT_TAG: 'v1' }, []],
    [{ CI: 'true', CI_COMMIT_TAG: 'v1' }, ['-p', 'onTag']],
    [{ CI_COMMIT_TAG: 'v1' }, []],
    [{ npm_lifecycle_event: 'release' }, []],
    [{ npm_lifecycle_event: 'release' }, ['-p', 'never']],
    [{ CI: 'true', GITHUB_BASE_REF: 'develop' }, ['-p', 'always']],
    [{ CI: 'true', GITHUB_BASE_REF: 'develop', PUBLISH_FOR_PULL_REQUEST: 'true' }, ['-p', 'always']],
    [{ CI: 'true', GITHUB_BASE_REF: 'develop', PUBLISH_FOR_PULL_REQUEST: 'true' }, []],
    [{ TRAVIS_PULL_REQUEST: '12' }, ['-p', 'always']],
    [{ IS_LOCAL: 'true' }, ['-p', 'always']],
    [{ IS_E2E: 'true', CI: 'true' }, []],
  ]
  for (const [env, argv] of cases) {
    const result = spawnSync(process.execPath, ['-e', child], {
      cwd: __dirname,
      encoding: 'utf8',
      env: { PATH: process.env.PATH, NODE_PATH: process.env.NODE_PATH ?? '', ...env, TEST_ARGV: JSON.stringify(argv) },
    })
    assert.equal(result.status, 0, result.stderr)
    const { real, mine } = JSON.parse(/RESULT (.*)$/.exec(result.stderr)[1])
    assert.equal(mine, real, `${JSON.stringify([env, argv])}: electron-builder says ${real}`)
  }
})
