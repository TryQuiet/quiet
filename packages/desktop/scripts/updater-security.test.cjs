const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const semver = require('semver')
const { build, dependencies } = require('../package.json')
const lock = require('../package-lock.json')
const { problems } = require('./verifyUpdateConfig.cjs')
const signing = require('./updateSigning.cjs')

const newKey = () => crypto.generateKeyPairSync('ed25519').privateKey
const pem = key => key.export({ type: 'pkcs8', format: 'pem' })

test('electron-updater is past the Windows signature-verification bypass (CVE-2024-39698, fixed in 6.3.0)', () => {
  const locked = lock.packages['node_modules/electron-updater'].version
  assert.ok(semver.gte(locked, '6.3.0'), `locked electron-updater ${locked}`)
  assert.ok(semver.gte(semver.minVersion(dependencies['electron-updater']), '6.3.0'), dependencies['electron-updater'])
})

test('the update feed is an HTTPS S3 bucket', () => {
  assert.equal(build.publish.provider, 's3')
  assert.equal(build.publish.endpoint, undefined)
})

test('electron-builder runs the signing hooks', () => {
  assert.equal(build.beforePack, 'scripts/beforePack.cjs')
  // artifactBuildCompleted fires per artifact before electron-builder uploads it: sign-before-upload
  assert.equal(build.artifactBuildCompleted, 'scripts/signArtifact.cjs')
  assert.equal(build.afterAllArtifactBuild, 'scripts/updateSigning.cjs')
})

test('verifyUpdateConfig flags a feed that is not the HTTPS S3 bucket', () => {
  const s3 = { provider: 's3', bucket: 'quiet.11.x', region: 'us-east-1', forcePathStyle: true }
  assert.deepEqual(problems(s3), [])
  assert.match(problems({ provider: 'generic', url: 'http://example.test' }).join('\n'), /not https/)
})

test('the main build can import (and so emit) the public keys file', () => {
  const tsconfig = fs.readFileSync(path.join(__dirname, '../tsconfig.build.json'), 'utf8')
  assert.match(tsconfig, /"resolveJsonModule":\s*true/)
})

test('the keys shipped in the app are Ed25519 public keys', () => {
  const keys = signing.loadPublicKeys()
  assert.ok(keys.length > 0)
  for (const key of keys) {
    const parsed = crypto.createPublicKey({ key: Buffer.from(key, 'base64'), format: 'der', type: 'spki' })
    assert.equal(parsed.asymmetricKeyType, 'ed25519')
  }
})

test('signFile writes a detached signature that verifies against the public key', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-signing-'))
  const file = path.join(dir, 'Quiet Setup 1.2.3.exe')
  fs.writeFileSync(file, 'installer bytes')
  const key = newKey()
  const sigFile = signing.signFile(file, '1.2.3', key)
  assert.equal(sigFile, `${file}.sig`)
  const sha512 = crypto.createHash('sha512').update('installer bytes').digest('base64')
  const statement = Buffer.from(signing.updateStatement('1.2.3', 'Quiet Setup 1.2.3.exe', sha512))
  const signature = Buffer.from(fs.readFileSync(sigFile, 'utf8').trim(), 'base64')
  assert.equal(crypto.verify(null, statement, crypto.createPublicKey(key), signature), true)
  assert.equal(crypto.verify(null, Buffer.from(`${statement}x`), crypto.createPublicKey(key), signature), false)
})

test('private keys are accepted as PEM or base64 PEM, and only if Ed25519', () => {
  const key = newKey()
  assert.equal(signing.publicKeyOf(signing.parsePrivateKey(pem(key))), signing.publicKeyOf(key))
  assert.equal(
    signing.publicKeyOf(signing.parsePrivateKey(Buffer.from(pem(key)).toString('base64'))),
    signing.publicKeyOf(key)
  )
  const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  assert.throws(() => signing.parsePrivateKey(pem(rsa)), /not an Ed25519 key/)
})

test('signingProblems: a build that is checked needs a key the app accepts, whatever event label it carries; macOS does not', () => {
  const key = newKey()
  const accepted = [signing.publicKeyOf(key)]
  const env = value => ({ [signing.KEY_ENV]: value })
  assert.deepEqual(signing.signingProblems('win32', env(pem(key)), accepted), [])
  assert.deepEqual(signing.signingProblems('linux', env(Buffer.from(pem(key)).toString('base64')), accepted), [])
  assert.match(signing.signingProblems('win32', {}, accepted).join(), /is not set/)
  assert.match(signing.signingProblems('linux', env(pem(newKey())), accepted).join(), /does not match any key/)
  assert.match(signing.signingProblems('linux', env('garbage'), accepted).join(), /unusable/)
  for (const label of [{ GITHUB_BASE_REF: 'develop' }, { IS_LOCAL: 'true' }, { IS_E2E: 'true' }, { E2E: 'true' }]) {
    assert.match(signing.signingProblems('win32', label, accepted).join(), /is not set/, JSON.stringify(label))
    assert.match(
      signing.signingProblems('win32', { ...label, ...env(pem(newKey())) }, accepted).join(),
      /does not match/
    )
  }
  assert.deepEqual(signing.signingProblems('darwin', {}, accepted), [])
})

const { inBuild } = require('./buildEnv.test-helper.cjs')

const buildOf = names => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-signing-'))
  return names.map(name => {
    const file = path.join(dir, name)
    fs.writeFileSync(file, name)
    return file
  })
}
const REQUIRED = { [signing.REQUIRE_ENV]: '1' }

test('each artifact is signed and verified when it is built; the after-build hook only hands the signatures on', async () => {
  const { version } = require('../package.json')
  const files = buildOf([
    `Quiet Setup ${version}.exe`,
    `Quiet Setup ${version}.exe.blockmap`,
    `Quiet-${version}.AppImage`,
  ])
  const key = newKey()
  const accepted = [signing.publicKeyOf(key)]
  await inBuild({ ...REQUIRED, [signing.KEY_ENV]: pem(key) }, async () => {
    assert.equal(signing.signArtifactWith(files[1], accepted), null, 'blockmaps are not signed')
    const signatures = [files[0], files[2]].map(file => signing.signArtifactWith(file, accepted))
    assert.deepEqual(
      signatures,
      [files[0], files[2]].map(file => `${file}.sig`)
    )
    assert.ok(!fs.existsSync(`${files[1]}.sig`))
    for (const file of [files[0], files[2]]) assert.equal(signing.verifySignatureFile(file, version, accepted), true)
    assert.equal(signing.verifySignatureFile(files[0], '0.0.1', accepted), false)
    assert.deepEqual(signing.collectSignaturesWith({ artifactPaths: files }, accepted), signatures)
    for (const name of ['Quiet-0.0.1.AppImage', `Quiet-1${version}.AppImage`]) {
      const [stale] = buildOf([name])
      assert.throws(() => signing.signArtifactWith(stale, accepted), /not built for version/)
    }
    // a signature that is missing or stale stops the after-build hook, so no feed is written
    fs.rmSync(`${files[2]}.sig`)
    assert.throws(
      () => signing.collectSignaturesWith({ artifactPaths: files }, accepted),
      /no valid release-key signature/
    )
    signing.signFile(files[2], '0.0.1', key)
    assert.throws(
      () => signing.collectSignaturesWith({ artifactPaths: files }, accepted),
      /no valid release-key signature/
    )
  })
  await inBuild({ [signing.KEY_ENV]: 'garbage' }, async () =>
    assert.throws(() => signing.signArtifactWith(files[0], accepted), /unusable/)
  )
})

test('a key that is present is always used, whether or not signing is required', async () => {
  const { version } = require('../package.json')
  const key = newKey()
  const accepted = [signing.publicKeyOf(key)]
  for (const env of [{}, { CI: 'true', GITHUB_BASE_REF: 'develop' }, { IS_LOCAL: 'true' }]) {
    const [file] = buildOf([`Quiet-${version}.AppImage`])
    await inBuild({ ...env, [signing.KEY_ENV]: pem(key) }, async () => {
      assert.equal(signing.signArtifactWith(file, accepted), `${file}.sig`, JSON.stringify(env))
      assert.deepEqual(signing.collectSignaturesWith({ artifactPaths: [file] }, accepted), [`${file}.sig`])
    })
    assert.equal(signing.verifySignatureFile(file, version, accepted), true)
  }
})

test('a key the app does not accept is refused whether or not signing is required', async () => {
  const { version } = require('../package.json')
  const [file] = buildOf([`Quiet-${version}.AppImage`])
  const accepted = [signing.publicKeyOf(newKey())]
  for (const env of [REQUIRED, {}, { CI: 'true', CI_COMMIT_TAG: 'v1' }, { IS_LOCAL: 'true' }]) {
    await inBuild({ ...env, [signing.KEY_ENV]: pem(newKey()) }, async () =>
      assert.throws(() => signing.signArtifactWith(file, accepted), /does not match any key/, JSON.stringify(env))
    )
  }
  assert.ok(!fs.existsSync(`${file}.sig`))
})

test('without a key an artifact stays unsigned unless signing is required; CI and event labels change nothing', async () => {
  const { version } = require('../package.json')
  const [file] = buildOf([`Quiet-${version}.AppImage`])
  const accepted = [signing.publicKeyOf(newKey())]
  const labels = [
    {},
    { CI: 'true' },
    { CI: 'true', GITHUB_BASE_REF: 'develop', PUBLISH_FOR_PULL_REQUEST: 'true' },
    { CI: 'true', CI_COMMIT_TAG: 'v1', GITHUB_REF_TYPE: 'tag' },
    { IS_LOCAL: 'true' },
    { IS_E2E: 'true' },
    { npm_lifecycle_event: 'release' },
  ]
  for (const env of labels) {
    await inBuild(env, async () => {
      assert.equal(signing.signArtifactWith(file, accepted), null, JSON.stringify(env))
      assert.deepEqual(signing.collectSignaturesWith({ artifactPaths: [file] }, accepted), [])
    })
    await inBuild({ ...env, ...REQUIRED }, async () => {
      assert.throws(() => signing.signArtifactWith(file, accepted), /is not set/, JSON.stringify(env))
      assert.throws(
        () => signing.collectSignaturesWith({ artifactPaths: [file] }, accepted),
        /no valid release-key signature/
      )
    })
  }
  for (const name of signing.PUBLISH_CREDENTIAL_ENV) {
    await inBuild({ [name]: 'x' }, async () =>
      assert.throws(() => signing.signArtifactWith(file, accepted), /is not set.*signing is required/, name)
    )
  }
  assert.ok(!fs.existsSync(`${file}.sig`))
  await inBuild({ [signing.REQUIRE_ENV]: 'true' }, async () =>
    assert.throws(() => signing.signArtifactWith(file, accepted), /must be 1 or unset/)
  )
})

// Only the release jobs publish, so they are the ones that must require signing. Checked on the workflows
// themselves so a new or renamed publishing step cannot drop the requirement unnoticed: a step counts as
// publishing if it runs electron-builder with a publish flag other than never, or with AWS credentials.
test('every CI step that can publish a Windows or Linux build requires signing and is followed by a signature check', () => {
  const yaml = require('js-yaml')
  const dir = path.join(__dirname, '../../../.github/workflows')
  const publishing = []
  for (const file of fs.readdirSync(dir).filter(name => /\.ya?ml$/.test(name))) {
    const workflow = yaml.load(fs.readFileSync(path.join(dir, file), 'utf8'))
    for (const [name, job] of Object.entries(workflow.jobs ?? {})) {
      const steps = job.steps ?? []
      steps.forEach((step, index) => {
        const run = step.run ?? ''
        if (!/electron-builder/.test(run) || /--mac\b/.test(run)) return
        const env = { ...workflow.env, ...job.env, ...step.env }
        const flag = /(^|\s)(-p|--publish)[ =](\S+)/.exec(run)?.[3]
        const credentials = signing.PUBLISH_CREDENTIAL_ENV.some(variable => env[variable] != null)
        if ((flag == null || flag === 'never') && !credentials) return
        const where = `${file} ${name}: ${step.name}`
        publishing.push(where)
        assert.equal(env[signing.REQUIRE_ENV], '1', where)
        assert.match(String(env[signing.KEY_ENV]), /secrets\.QUIET_UPDATE_SIGNING_KEY/, where)
        assert.ok(
          steps.slice(index + 1).some(later => /verifyUpdateSignatures\.cjs/.test(later.run ?? '')),
          `${where}: no verifyUpdateSignatures step after it`
        )
      })
    }
  }
  assert.ok(publishing.length >= 2, `expected at least the Linux and Windows release steps, found ${publishing}`)
})

test('verifyUpdateSignatures accepts signed builds and flags missing, stale or foreign signatures', () => {
  const { problems: verify } = require('./verifyUpdateSignatures.cjs')
  const { version } = require('../package.json')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-signing-'))
  const file = path.join(dir, `Quiet Setup ${version}.exe`)
  fs.writeFileSync(file, 'installer')
  const key = newKey()
  const accepted = [signing.publicKeyOf(key)]
  assert.match(verify(dir, accepted).join(), /no \.sig/)
  signing.signFile(file, version, key)
  assert.deepEqual(verify(dir, accepted), [])
  assert.match(verify(dir, [signing.publicKeyOf(newKey())]).join(), /not valid/)
  signing.signFile(file, '0.0.1', key)
  assert.match(verify(dir, accepted).join(), /not valid/)
  assert.match(verify(fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-signing-')), accepted).join(), /no \.exe/)
})

test('checkUpdateSigningKey demands a key that matches the pinned one, even on pull_request events', () => {
  const { check } = require('./checkUpdateSigningKey.cjs')
  const { publicKeyOf } = require('./updateSigning.cjs')
  const crypto = require('node:crypto')
  const mine = crypto.generateKeyPairSync('ed25519').privateKey
  const pem = mine.export({ type: 'pkcs8', format: 'pem' })
  const pinned = [publicKeyOf(mine)]
  assert.deepStrictEqual(check({ QUIET_UPDATE_SIGNING_KEY: pem }, pinned).problems, [])
  assert.strictEqual(check({ QUIET_UPDATE_SIGNING_KEY: pem, GITHUB_BASE_REF: 'develop' }, pinned).publicKey, pinned[0])
  assert.match(check({}, pinned).problems.join(), /not set/)
  assert.match(check({ QUIET_UPDATE_SIGNING_KEY: '', GITHUB_BASE_REF: 'develop' }, pinned).problems.join(), /not set/)
  assert.match(
    check({ QUIET_UPDATE_SIGNING_KEY: pem }, [
      'MCowBQYDK2VwAyEA4oQdkZ2SffV6BF+8XyahH6sAhvpWF578nzX79rTHi0c=',
    ]).problems.join(),
    /does not match/
  )
  assert.match(check({ QUIET_UPDATE_SIGNING_KEY: 'garbage' }, pinned).problems.join(), /unusable/)
})
