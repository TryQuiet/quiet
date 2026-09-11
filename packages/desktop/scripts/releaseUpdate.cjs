const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const yaml = require('js-yaml')
const { buildTrust } = require('./updateTrust.cjs')
const { readTrust, publisherNames, subjectsEqual } = require('../updater/trust.cjs')
const { verifyWindowsSignature } = require('../updater/windows-signature.cjs')
const { verifyArtifact } = require('../updater/index.cjs')
const { TufProvider } = require('../updater/tuf-provider.cjs')

const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')

async function stage(project, platform, output) {
  if (!['linux', 'win32'].includes(platform)) throw new Error('Unsupported release platform')
  const version = JSON.parse(fs.readFileSync(path.join(project, 'package.json'))).version
  const { trust, rootPath } = buildTrust(project, version, platform)
  const resources = path.join(project, 'dist', platform === 'linux' ? 'linux-unpacked' : 'win-unpacked', 'resources')
  const embedded = readTrust(resources)
  if (hash(embedded.rootPath) !== hash(rootPath) || Object.keys(trust).some(key => JSON.stringify(embedded[key]) !== JSON.stringify(trust[key]))) {
    throw new Error('Packaged update trust differs from approved release trust')
  }
  const legacyName = `${trust.channel}${platform === 'linux' ? '-linux' : ''}.yml`
  const manifest = path.join(project, 'dist', legacyName)
  const info = yaml.load(fs.readFileSync(manifest, 'utf8'))
  if (info.version !== version || info.files?.length !== 1 || path.basename(info.files[0].url) !== info.files[0].url) {
    throw new Error('Unexpected final release manifest')
  }
  const artifact = path.join(project, 'dist', info.files[0].url)
  verifyArtifact(artifact, info)
  if (platform === 'win32') {
    const config = yaml.load(fs.readFileSync(path.join(resources, 'app-update.yml'), 'utf8'))
    const names = publisherNames(config.publisherName)
    if (names.length !== trust.windowsPublisherNames.length || !names.every(name => trust.windowsPublisherNames.some(expected => subjectsEqual(name, expected)))) {
      throw new Error('Packaged updater does not contain the approved Windows publishers')
    }
    await verifyWindowsSignature(trust.windowsPublisherNames, artifact)
  }
  fs.mkdirSync(output, { recursive: false })
  const files = [artifact, manifest]
  if (fs.existsSync(`${artifact}.blockmap`)) files.push(`${artifact}.blockmap`)
  const digests = {}
  for (const file of files) {
    fs.copyFileSync(file, path.join(output, path.basename(file)))
    digests[path.basename(file)] = hash(file)
  }
  fs.writeFileSync(path.join(output, 'release.json'), JSON.stringify({ version, platform, architecture: process.arch,
    channel: trust.channel, sourceCommit: process.env.GITHUB_SHA || null, manifest: legacyName,
    target: `${platform}/${process.arch}/${trust.channel}.yml`, files: digests }, null, 2))
}

async function verify(project, staged, output) {
  const receipt = JSON.parse(fs.readFileSync(path.join(staged, 'release.json'), 'utf8'))
  if (!['linux', 'win32'].includes(receipt.platform) || receipt.architecture !== process.arch ||
      receipt.target !== `${receipt.platform}/${receipt.architecture}/${receipt.channel}.yml`) throw new Error('Unexpected staged target identity')
  const { trust, rootPath } = buildTrust(project, receipt.version, receipt.platform)
  if (receipt.channel !== trust.channel || receipt.manifest !== `${trust.channel}${receipt.platform === 'linux' ? '-linux' : ''}.yml`) throw new Error('Unexpected staged channel')
  for (const [name, digest] of Object.entries(receipt.files)) {
    if (path.basename(name) !== name || hash(path.join(staged, name)) !== digest) throw new Error('Staged release changed after build')
  }
  const provider = new TufProvider({ ...trust, rootPath, cachePath: path.join(staged, '.tuf-cache') }, null,
    { platform: receipt.platform, isUseMultipleRangeRequest: false, executor: null })
  const info = await provider.getLatestVersion()
  const manifest = path.join(staged, receipt.manifest)
  if (!provider.verifiedManifest.equals(fs.readFileSync(manifest)) || info.version !== receipt.version) {
    throw new Error('TUF has not authorized the exact staged release manifest')
  }
  const artifact = path.join(staged, info.files[0].url)
  verifyArtifact(artifact, info)
  if (receipt.platform === 'win32') await verifyWindowsSignature(trust.windowsPublisherNames, artifact)
  fs.mkdirSync(output, { recursive: false })
  fs.copyFileSync(manifest, path.join(output, receipt.manifest))
  return receipt
}

async function artifacts(project, staged, output) {
  const receipt = JSON.parse(fs.readFileSync(path.join(staged, 'release.json'), 'utf8'))
  if (!['linux', 'win32'].includes(receipt.platform) || receipt.architecture !== process.arch) throw new Error('Unexpected staged platform')
  const { trust } = buildTrust(project, receipt.version, receipt.platform)
  if (receipt.channel !== trust.channel || receipt.manifest !== `${trust.channel}${receipt.platform === 'linux' ? '-linux' : ''}.yml`) throw new Error('Unexpected staged channel')
  const info = yaml.load(fs.readFileSync(path.join(staged, receipt.manifest), 'utf8'))
  if (info.version !== receipt.version || info.files?.length !== 1 || path.basename(info.files[0].url) !== info.files[0].url) throw new Error('Invalid staged manifest')
  const name = info.files[0].url
  if (!name.endsWith(receipt.platform === 'linux' ? '.AppImage' : '.exe')) throw new Error('Invalid staged artifact extension')
  const artifact = path.join(staged, name)
  if (hash(artifact) !== receipt.files[name]) throw new Error('Staged artifact changed')
  verifyArtifact(artifact, info)
  if (receipt.platform === 'win32') await verifyWindowsSignature(trust.windowsPublisherNames, artifact)
  fs.mkdirSync(output, { recursive: false })
  fs.copyFileSync(artifact, path.join(output, name))
  if (receipt.files[`${name}.blockmap`]) {
    const blockmap = path.join(staged, `${name}.blockmap`)
    if (hash(blockmap) !== receipt.files[`${name}.blockmap`]) throw new Error('Staged blockmap changed')
    fs.copyFileSync(blockmap, path.join(output, `${name}.blockmap`))
  }
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2)
  const action = command === 'stage' ? stage : command === 'verify' ? verify : command === 'artifacts' ? artifacts : null
  if (!action) throw new Error('Usage: releaseUpdate.cjs stage PROJECT PLATFORM OUTPUT | verify PROJECT STAGED OUTPUT')
  action(...args).catch(error => { console.error(error.message); process.exitCode = 1 })
}

module.exports = { stage, verify, artifacts }
