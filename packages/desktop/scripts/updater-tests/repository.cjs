const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const https = require('node:https')
const { createHash } = require('node:crypto')
const { KeyPair } = require('@tufjs/repo-mock/dist/key')
const { Metadata, Root, Targets, TargetFile, Snapshot, Timestamp, MetaFile } = require('@tufjs/models')
const yaml = require('js-yaml')

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const encode = metadata => Buffer.from(JSON.stringify(metadata))
const expires = () => new Date(Date.now() + 86_400_000).toISOString()

async function repository(t, platform = 'linux', tls = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-update-test-'))
  const key = new KeyPair()
  const objects = new Map()
  const requests = []
  const ranges = []
  const fullArtifactRequests = []
  const beforeCleanup = []
  let certificate
  let serverOptions
  if (tls) {
    certificate = path.join(directory, 'localhost.crt')
    const privateKey = path.join(directory, 'localhost.key')
    require('node:child_process').execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
      '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1', '-keyout', privateKey, '-out', certificate], { stdio: 'ignore' })
    serverOptions = { key: fs.readFileSync(privateKey), cert: fs.readFileSync(certificate) }
  }
  const handler = (request, response) => {
    const name = decodeURIComponent(request.url.split('?')[0])
    requests.push(name)
    const object = objects.get(name)
    if (object?.redirect) { response.writeHead(302, { location: object.redirect }); response.end(); return }
    if (!object) { response.writeHead(404); response.end(); return }
    if (request.headers.range) {
      const match = /^bytes=(\d+)-(\d+)?$/.exec(request.headers.range)
      if (!match) { response.writeHead(416); response.end(); return }
      const start = Number(match[1])
      const end = match[2] ? Number(match[2]) : object.length - 1
      ranges.push(request.headers.range)
      response.writeHead(206, { 'content-range': `bytes ${start}-${end}/${object.length}`, 'content-length': end - start + 1 })
      response.end(object.subarray(start, end + 1))
      return
    }
    if (name.startsWith('/artifacts/')) fullArtifactRequests.push(name)
    response.writeHead(200, { 'content-length': object.length })
    response.end(object)
  }
  const server = tls ? https.createServer(serverOptions, handler) : http.createServer(handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    for (const cleanup of beforeCleanup) await cleanup()
    await new Promise(resolve => server.close(resolve))
    fs.rmSync(directory, { force: true, recursive: true })
  })
  const base = `${tls ? 'https' : 'http'}://127.0.0.1:${server.address().port}/`
  const targetName = `${platform}/${process.arch}/latest.yml`
  const root = new Metadata(new Root({ version: 1, expires: expires(), consistentSnapshot: false }))
  for (const role of ['root', 'targets', 'snapshot', 'timestamp']) root.signed.addKey(key.publicKey, role)
  root.sign(data => key.sign(data))
  const rootPath = path.join(directory, 'embedded-root.json')
  fs.writeFileSync(rootPath, encode(root))
  let version = 0
  function publish(content, options = {}) {
    const artifactName = platform === 'linux' ? 'Quiet-2.0.0.AppImage' : 'Quiet-2.0.0.exe'
    const artifact = options.artifact || Buffer.from('#!/bin/sh\nprintf installed > "$QUIET_TEST_INSTALLED"\n')
    const info = { version: '2.0.0', files: [{ url: artifactName, size: artifact.length,
      sha512: createHash('sha512').update(artifact).digest('base64') }], ...options.info }
    const manifest = content || Buffer.from(yaml.dump(info))
    const metadataVersion = options.version || ++version
    const deadline = options.expires || expires()
    const signingKey = options.signingKey || key
    const targets = new Metadata(new Targets({ version: metadataVersion, expires: deadline }))
    targets.signed.addTarget(new TargetFile({ path: options.targetName || targetName, length: manifest.length, hashes: { sha256: digest(manifest) } }))
    targets.sign(data => signingKey.sign(data))
    const targetsBytes = encode(targets)
    const snapshot = new Metadata(new Snapshot({ version: metadataVersion, expires: deadline,
      meta: { 'targets.json': new MetaFile({ version: metadataVersion, length: targetsBytes.length, hashes: { sha256: digest(targetsBytes) } }) } }))
    snapshot.sign(data => key.sign(data))
    const snapshotBytes = encode(snapshot)
    const timestamp = new Metadata(new Timestamp({ version: metadataVersion, expires: deadline,
      snapshotMeta: new MetaFile({ version: metadataVersion, length: snapshotBytes.length, hashes: { sha256: digest(snapshotBytes) } }) }))
    timestamp.sign(data => key.sign(data))
    objects.set('/metadata/targets.json', targetsBytes)
    objects.set('/metadata/snapshot.json', snapshotBytes)
    objects.set('/metadata/timestamp.json', encode(timestamp))
    objects.set(`/targets/${options.targetName || targetName}`, manifest)
    objects.set(`/artifacts/${artifactName}`, artifact)
    return { info, manifest, artifact, artifactName, targets, snapshot, timestamp }
  }
  const trust = { rootPath, channel: 'latest', metadataBaseUrl: `${base}metadata/`,
    targetBaseUrl: `${base}targets/`, artifactBaseUrl: `${base}artifacts/`,
    windowsPublisherNames: ['CN=Quiet Updater Test, O=Quiet Updater Test'] }
  return { directory, key, objects, requests, ranges, fullArtifactRequests, base, root, trust, publish, targetName, beforeCleanup, certificate }
}

module.exports = { repository, encode, expires, KeyPair }
