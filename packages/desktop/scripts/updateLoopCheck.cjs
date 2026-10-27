// Runs the real electron-updater (AppImageUpdater on linux, NsisUpdater on win32) with the app's
// update hardening against a feed served over HTTP by another process, and checks which updates
// get installed. Usage:
//   node updateLoopCheck.cjs serve <port> <public-key-file>   (generates its own test signing key)
//   node updateLoopCheck.cjs check <feed-base-url> <public-key-file> [linux|win32]
// Needs the compiled app code: `npm run build:main` (dist/main/updaterSecurity.js).
const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const os = require('os')
const path = require('path')

const VERSION = '99.0.0'
const NAMES = { linux: `Quiet-${VERSION}.AppImage`, win32: `Quiet Setup ${VERSION}.exe` }
const sha512 = data => crypto.createHash('sha512').update(data).digest('base64')

const newKey = () => crypto.generateKeyPairSync('ed25519').privateKey
const publicKeyOf = key => crypto.createPublicKey(key).export({ type: 'spki', format: 'der' }).toString('base64')
const statement = (version, file, hash) =>
  `quiet-update-signature-v1\nversion:${version}\nfile:${file}\nsha512:${hash}\n`
const sign = (key, version, file, bytes) =>
  Buffer.from(crypto.sign(null, Buffer.from(statement(version, file, sha512(bytes))), key).toString('base64') + '\n')

// case -> what the client expects. 'downloaded' means the update passed verification and is ready to
// install; the install step itself (re-verification right before it) is covered by updaterSecurity.test.ts.
// `installed` is the version the client claims to run. `fetched` is whether the installer itself may be
// requested: a bad signature is refused on the feed's announcement, before any installer byte is fetched.
const CASES = {
  control: { expect: 'downloaded', fetched: true },
  tampered: { expect: 'rejected', error: /does not match/, fetched: false },
  'wrong-signer': { expect: 'rejected', error: /does not match/, fetched: false },
  unsigned: { expect: 'rejected', error: /could not fetch the signature/, fetched: false },
  'garbage-signature': { expect: 'rejected', error: /malformed|does not match/, fetched: false },
  'replayed-old-signature': { expect: 'rejected', error: /does not match/, fetched: false },
  'feed-hash-mismatch': { expect: 'rejected', error: /sha512 checksum mismatch|checksum/i, fetched: true },
  downgrade: { expect: 'no-update', installed: '100.0.0', fetched: false },
  'prerelease-for-stable': { expect: 'rejected', error: /Pre-release/, fetched: false },
}

const serve = (port, publicKeyFile) => {
  const release = newKey()
  const other = newKey()
  fs.writeFileSync(publicKeyFile, publicKeyOf(release))
  const genuine = file => Buffer.from(`genuine update ${file} `.repeat(2000))
  const evil = Buffer.from('malicious payload '.repeat(2000))
  const feed = (file, announced, declared, version = VERSION) =>
    `version: ${version}\nfiles:\n  - url: ${JSON.stringify(file)}\n    sha512: ${sha512(declared)}\n    size: ${
      declared.length
    }\n` + `path: ${JSON.stringify(file)}\nsha512: ${sha512(declared)}\nreleaseDate: '2026-01-01T00:00:00.000Z'\n`
  const routes = {}
  for (const file of Object.values(NAMES)) {
    const good = genuine(file)
    const add = (name, body, sig, { version = VERSION, declared = body } = {}) => {
      const feedBody = Buffer.from(feed(file, body, declared, version))
      // The channel file the updater asks for follows the host OS: latest.yml on Windows, latest-linux.yml on Linux.
      routes[`/${name}/${file.endsWith('.exe') ? 'latest.yml' : 'latest-linux.yml'}`] = feedBody
      routes[`/${name}/${file}`] = body
      if (sig) routes[`/${name}/${file}.sig`] = sig
    }
    add('control', good, sign(release, VERSION, file, good))
    add('tampered', evil, sign(release, VERSION, file, good))
    add('wrong-signer', good, sign(other, VERSION, file, good))
    add('unsigned', good, null)
    add('garbage-signature', good, Buffer.from('<html>nope</html>'))
    add('replayed-old-signature', good, sign(release, '98.0.0', file, good))
    // a genuine signature over the hash the feed announces, but other bytes served: downloaded, then refused
    add('feed-hash-mismatch', evil, sign(release, VERSION, file, good), { declared: good })
    add('downgrade', good, sign(release, VERSION, file, good))
    const pre = '99.0.0-alpha.1'
    add('prerelease-for-stable', good, sign(release, pre, file, good), { version: pre })
  }
  // `GET /__installer-requests/<case>`: how many times that case's installer (not its .sig) was requested
  const installerRequests = {}
  const server = http.createServer((req, res) => {
    const requested = decodeURIComponent(req.url.split('?')[0])
    const counted = /^\/__installer-requests\/([^/]+)$/.exec(requested)
    if (counted) return void res.writeHead(200).end(String(installerRequests[counted[1]] ?? 0))
    const [, name, file] = requested.split('/')
    if (Object.values(NAMES).includes(file)) installerRequests[name] = (installerRequests[name] ?? 0) + 1
    const body = routes[requested]
    if (!body) return void res.writeHead(404).end()
    res.writeHead(200, { 'content-length': body.length }).end(body)
  })
  server.listen(port, '0.0.0.0', () => console.log(`feed listening on ${port}`))
}

const check = async (base, publicKeyFile, platform = process.platform === 'win32' ? 'win32' : 'linux') => {
  const { NodeHttpExecutor } = require('builder-util/out/nodeHttpExecutor')
  const { configureRequestOptions, configureRequestUrl } = require('builder-util-runtime')
  const { AppImageUpdater, NsisUpdater } = require('electron-updater')
  const { hardenUpdater } = require('../dist/main/updaterSecurity.js')
  const publicKey = fs.readFileSync(publicKeyFile, 'utf8').trim()
  const work = fs.mkdtempSync(path.join(process.env.QUIET_LOOP_TMP || os.tmpdir(), 'quiet-loop-'))
  if (platform === 'linux') process.env.APPIMAGE = path.join(work, 'Quiet-1.0.0.AppImage')

  class Executor extends NodeHttpExecutor {
    download(url, destination, options) {
      return options.cancellationToken.createPromise((resolve, reject, onCancel) => {
        const requestOptions = { headers: options.headers || undefined, redirect: 'manual' }
        configureRequestUrl(url, requestOptions)
        configureRequestOptions(requestOptions)
        this.doDownload(
          requestOptions,
          {
            destination,
            options,
            onCancel,
            callback: e => (e == null ? resolve(destination) : reject(e)),
            responseHandler: null,
          },
          0
        )
      })
    }
  }

  const results = []
  const run = async (name, spec) => {
    const dir = fs.mkdtempSync(path.join(work, `${name}-`))
    const configPath = path.join(dir, 'app-update.yml')
    fs.writeFileSync(configPath, `provider: generic\nurl: ${base}/${name}\n`)
    const adapter = {
      version: spec.installed || '1.0.0',
      name: 'Quiet',
      isPackaged: true,
      appUpdateConfigPath: configPath,
      userDataPath: dir,
      baseCachePath: path.join(dir, 'cache'),
      whenReady: async () => undefined,
      relaunch: () => undefined,
      quit: () => undefined,
      onQuit: () => undefined,
    }
    const updater = platform === 'linux' ? new AppImageUpdater(undefined, adapter) : new NsisUpdater(undefined, adapter)
    updater.httpExecutor = new Executor()
    updater.autoDownload = false
    updater.autoInstallOnAppQuit = false
    updater.disableDifferentialDownload = true
    hardenUpdater(updater, platform, { publicKeys: [publicKey] })
    let outcome
    try {
      const result = await updater.checkForUpdates()
      if (!result?.isUpdateAvailable) outcome = { kind: 'no-update' }
      else {
        const files = await updater.downloadUpdate()
        outcome = { kind: 'downloaded', file: files[0], installerPath: updater.installerPath }
      }
    } catch (error) {
      outcome = {
        kind: 'rejected',
        error: String(error.message || error).split('\n')[0],
        installerPath: updater.installerPath ?? null,
      }
    }
    const fetched = Number(await (await fetch(`${base}/__installer-requests/${name}`)).text()) > 0
    let ok = outcome.kind === spec.expect && fetched === spec.fetched
    if (ok && spec.error) ok = spec.error.test(outcome.error)
    if (ok && spec.expect === 'rejected') ok = outcome.installerPath === null
    if (ok && spec.expect === 'downloaded') ok = fs.existsSync(outcome.file)
    results.push({ name, platform, expect: spec.expect, got: outcome.kind, fetched, detail: outcome.error || null, ok })
  }
  for (const [name, spec] of Object.entries(CASES)) await run(name, spec)

  // The shipped config policy: the packaged feed must be https.
  const { problems } = require('./verifyUpdateConfig.cjs')
  const http = problems({ provider: 's3', url: 'http://quiet.example/x' })
  results.push({
    name: 'http-feed-config',
    platform,
    expect: 'refused',
    got: http.length ? 'refused' : 'accepted',
    detail: http[0] || null,
    ok: http.length > 0,
  })
  fs.rmSync(work, { recursive: true, force: true })
  return results
}

if (require.main === module) {
  const [mode, a, b, c] = process.argv.slice(2)
  if (mode === 'serve') serve(Number(a), b)
  else if (mode === 'check') {
    check(a, b, c).then(results => {
      console.log(JSON.stringify(results, null, 2))
      process.exit(results.every(r => r.ok) ? 0 : 1)
    })
  } else {
    console.error('usage: updateLoopCheck.cjs serve <port> <key-file> | check <feed-url> <key-file> [platform]')
    process.exit(2)
  }
}
module.exports = { check, CASES, NAMES }
