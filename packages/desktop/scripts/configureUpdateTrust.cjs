const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { parseArgs } = require('node:util')
const { buildTrust } = require('./updateTrust.cjs')

// Initial provisioning only. Existing installations must rotate trust through
// sequential, threshold-signed roots, not by rerunning this helper.
function configureUpdateTrust({ projectDir, rootPath, sha256, metadataBaseUrl, targetBaseUrl }) {
  if (!/^[a-f0-9]{64}$/i.test(sha256 || '')) throw new Error('Provide the independently reviewed root SHA-256')
  if (fs.statSync(rootPath).size > 512 * 1024) throw new Error('Bootstrap root exceeds 512 KiB')
  const root = fs.readFileSync(rootPath)
  if (createHash('sha256').update(root).digest('hex') !== sha256.toLowerCase()) {
    throw new Error('Bootstrap root does not match the reviewed SHA-256')
  }
  const configPath = path.join(projectDir, 'build/update-trust.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  const channels = { latest: 'https://s3.amazonaws.com/quiet.9.x/', alpha: 'https://s3.amazonaws.com/test.quiet/' }
  for (const [channel, artifactBaseUrl] of Object.entries(channels)) {
    if (
      config.repositories[channel] ||
      fs.existsSync(path.join(projectDir, 'build/update-trust', channel, 'root.json'))
    ) {
      throw new Error(`${channel} already has trust configuration; use the documented rotation process`)
    }
    config.repositories[channel] = { metadataBaseUrl, targetBaseUrl, artifactBaseUrl }
  }
  const encodedConfig = `${JSON.stringify(config, null, 2)}\n`
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-trust-provision-'))
  try {
    // Exercise the real production packaging gate before changing either channel.
    for (const channel of Object.keys(channels)) {
      const dir = path.join(temporary, 'build/update-trust', channel)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'root.json'), root)
    }
    fs.writeFileSync(path.join(temporary, 'build/update-trust.json'), encodedConfig)
    buildTrust(temporary, '1.0.0', 'win32')
    buildTrust(temporary, '1.0.0-alpha.0', 'win32')
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
  for (const channel of Object.keys(channels)) {
    const dir = path.join(projectDir, 'build/update-trust', channel)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'root.json'), root, { flag: 'wx' })
  }
  fs.writeFileSync(configPath, encodedConfig)
}

if (require.main === module) {
  try {
    const { values } = parseArgs({
      options: {
        root: { type: 'string' },
        sha256: { type: 'string' },
        'metadata-url': { type: 'string' },
        'targets-url': { type: 'string' },
      },
    })
    if (Object.keys(values).length !== 4) {
      throw new Error(
        'Usage: node scripts/configureUpdateTrust.cjs --root FILE --sha256 HASH --metadata-url HTTPS_URL/ --targets-url HTTPS_URL/'
      )
    }
    configureUpdateTrust({
      projectDir: path.resolve(__dirname, '..'),
      rootPath: values.root,
      sha256: values.sha256,
      metadataBaseUrl: values['metadata-url'],
      targetBaseUrl: values['targets-url'],
    })
    process.stdout.write(
      'Installed reviewed public trust for latest and alpha. Review and commit build/update-trust.json and build/update-trust/.\n'
    )
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  }
}

module.exports = { configureUpdateTrust }
