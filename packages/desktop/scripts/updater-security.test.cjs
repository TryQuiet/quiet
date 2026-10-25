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

test('signingProblems: releases need a key the app accepts; PR, local and e2e builds and macOS do not', () => {
  const key = newKey()
  const accepted = [signing.publicKeyOf(key)]
  const env = value => ({ [signing.KEY_ENV]: value })
  assert.deepEqual(signing.signingProblems('win32', env(pem(key)), accepted), [])
  assert.deepEqual(signing.signingProblems('linux', env(Buffer.from(pem(key)).toString('base64')), accepted), [])
  assert.match(signing.signingProblems('win32', {}, accepted).join(), /is not set/)
  assert.match(signing.signingProblems('linux', env(pem(newKey())), accepted).join(), /does not match any key/)
  assert.match(signing.signingProblems('linux', env('garbage'), accepted).join(), /unusable/)
  for (const skip of [{ GITHUB_EVENT_NAME: 'pull_request' }, { IS_LOCAL: 'true' }, { IS_E2E: 'true' }]) {
    assert.deepEqual(signing.signingProblems('win32', skip, accepted), [])
  }
  assert.deepEqual(signing.signingProblems('darwin', {}, accepted), [])
})

test('signUpdates signs installers and AppImages, never blockmaps, when the key is set', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-signing-'))
  const { version } = require('../package.json')
  const files = [`Quiet Setup ${version}.exe`, `Quiet Setup ${version}.exe.blockmap`, `Quiet-${version}.AppImage`].map(
    name => {
      const file = path.join(dir, name)
      fs.writeFileSync(file, name)
      return file
    }
  )
  const saved = process.env[signing.KEY_ENV]
  try {
    delete process.env[signing.KEY_ENV]
    assert.deepEqual(await signing.default({ artifactPaths: files }), [])
    process.env[signing.KEY_ENV] = pem(newKey())
    assert.deepEqual(
      await signing.default({ artifactPaths: files }),
      [files[0], files[2]].map(file => `${file}.sig`)
    )
    assert.ok(!fs.existsSync(`${files[1]}.sig`))
    for (const name of ['Quiet-0.0.1.AppImage', `Quiet-1${version}.AppImage`]) {
      const stale = path.join(dir, name)
      fs.writeFileSync(stale, 'stale')
      await assert.rejects(signing.default({ artifactPaths: [stale] }), /not built for version/)
    }
    process.env[signing.KEY_ENV] = 'garbage'
    await assert.rejects(signing.default({ artifactPaths: files }))
  } finally {
    if (saved === undefined) delete process.env[signing.KEY_ENV]
    else process.env[signing.KEY_ENV] = saved
  }
})

test('signUpdates only lets unpublished builds go unsigned', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-signing-'))
  const { version } = require('../package.json')
  const file = path.join(dir, `Quiet-${version}.AppImage`)
  fs.writeFileSync(file, 'x')
  const saved = { ...process.env }
  const reset = env => {
    for (const name of ['CI', 'GITHUB_EVENT_NAME', 'IS_LOCAL', 'IS_E2E', 'E2E', signing.KEY_ENV])
      delete process.env[name]
    Object.assign(process.env, env)
  }
  try {
    reset({})
    assert.deepEqual(await signing.default({ artifactPaths: [file] }), [], 'local build')
    for (const skip of [
      { GITHUB_EVENT_NAME: 'pull_request' },
      { IS_LOCAL: 'true' },
      { IS_E2E: 'true' },
      { E2E: 'true' },
    ]) {
      reset({ CI: 'true', ...skip })
      assert.deepEqual(await signing.default({ artifactPaths: [file] }), [], JSON.stringify(skip))
    }
    reset({ CI: 'true' })
    await assert.rejects(signing.default({ artifactPaths: [file] }), /not set/)
    // e.g. `npm run distUbuntu` in the e2e workflows
    const argv = process.argv
    try {
      process.argv = [...argv, '--linux', '--publish', 'never']
      assert.deepEqual(await signing.default({ artifactPaths: [file] }), [], '--publish never')
    } finally {
      process.argv = argv
    }
  } finally {
    for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name]
    Object.assign(process.env, saved)
  }
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
