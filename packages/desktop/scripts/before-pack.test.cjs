const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
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

test('the CLI is identified by the real electron-builder entry point, not by a name', async () => {
  const { explicitlyUnpublished } = signing
  const argv = ['--linux', '--publish', 'never']
  const cli = require.resolve('electron-builder/cli.js')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-id-'))
  try {
    // how the npm .bin shim, a relative path and a differently-cased path reach it
    const shim = path.join(dir, 'electron-builder')
    fs.symlinkSync(cli, shim)
    assert.equal(explicitlyUnpublished(['node', cli, ...argv]), true)
    assert.equal(explicitlyUnpublished(['node', shim, ...argv]), true)
    assert.equal(explicitlyUnpublished(['node', path.relative(process.cwd(), cli), ...argv]), true)
    if (process.platform === 'win32') {
      assert.equal(explicitlyUnpublished(['node', cli.toUpperCase(), ...argv]), true)
    }
    // scripts of the same names that drive the JS API are not the CLI
    for (const name of ['electron-builder', 'electron-builder.js', 'electron-builder.cmd', 'cli.js']) {
      const script = path.join(dir, 'js-api', name)
      fs.mkdirSync(path.dirname(script), { recursive: true })
      fs.writeFileSync(script, "require('electron-builder').build({ publish: 'always' })\n")
      assert.equal(explicitlyUnpublished(['node', script, ...argv]), false, name)
    }
    assert.equal(explicitlyUnpublished(['node', '/usr/bin/electron-builder', ...argv]), false)
    assert.equal(explicitlyUnpublished(['node', 'release-script.js', ...argv]), false)
    assert.equal(explicitlyUnpublished(['node']), false)
    // and the hook refuses such a script, carrying the flags, without a key
    await inBuild({}, argv, () => {
      process.argv[1] = path.join(dir, 'js-api', 'electron-builder.js')
      return assert.rejects(
        beforePack({ electronPlatformName: 'linux', packager: {}, arch: 1 }, async () => s3),
        /is not set/
      )
    })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// The answer comes from electron-builder's own yargs definition of its build command.
test("explicitlyUnpublished agrees with electron-builder's own parse of the command line", () => {
  const cli = ['node', require.resolve('electron-builder/cli.js')]
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
