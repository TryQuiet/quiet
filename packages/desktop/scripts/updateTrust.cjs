const fs = require('node:fs')
const path = require('node:path')
const { publisherNames, validateTrust } = require('../updater/trust.cjs')
const { Updater } = require('tuf-js')
const os = require('node:os')

function buildTrust(projectDir, version, platform) {
  const config = JSON.parse(fs.readFileSync(path.join(projectDir, 'build/update-trust.json'), 'utf8'))
  const channel = version.includes('-') ? version.split('-')[1].split('.')[0] : 'latest'
  const repository = config.repositories[channel]
  if (!repository) throw new Error(`Provision the approved ${channel} TUF repository in build/update-trust.json before releasing`)
  const trust = validateTrust({ ...repository, channel, windowsPublisherNames: config.windowsPublisherNames })
  if (platform === 'win32') publisherNames(trust.windowsPublisherNames)
  const rootPath = path.join(projectDir, 'build/update-trust', channel, 'root.json')
  const root = JSON.parse(fs.readFileSync(rootPath, 'utf8'))
  if (!(Date.parse(root.signed.expires) > Date.now())) throw new Error('The packaged TUF root is expired or has no valid expiry')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-root-check-'))
  try {
    fs.copyFileSync(rootPath, path.join(temporary, 'root.json'))
    // The standard client validates the bootstrap root's threshold signatures.
    new Updater({ metadataDir: temporary, metadataBaseUrl: trust.metadataBaseUrl })
  } finally { fs.rmSync(temporary, { recursive: true, force: true }) }
  return { trust, rootPath }
}

function isPreview() {
  return process.env.GITHUB_EVENT_NAME === 'pull_request' || process.env.IS_LOCAL === 'true' || process.env.IS_E2E === 'true'
}

exports.beforePack = async context => {
  if (!['linux', 'win32'].includes(context.electronPlatformName) || isPreview()) return
  const { trust } = buildTrust(context.packager.projectDir, context.packager.appInfo.version, context.electronPlatformName)
  if (context.electronPlatformName === 'win32') {
    context.packager.config.forceCodeSigning = true
    context.packager.config.win.signtoolOptions = {
      ...context.packager.config.win.signtoolOptions, publisherName: trust.windowsPublisherNames,
    }
  }
}

exports.afterPack = async context => {
  if (!['linux', 'win32'].includes(context.electronPlatformName) || isPreview()) return
  const { trust, rootPath } = buildTrust(context.packager.projectDir, context.packager.appInfo.version, context.electronPlatformName)
  const resources = context.packager.getResourcesDir(context.appOutDir)
  fs.writeFileSync(path.join(resources, 'update-trust.json'), JSON.stringify(trust, null, 2))
  fs.copyFileSync(rootPath, path.join(resources, 'update-root.json'))
  require('../updater/trust.cjs').readTrust(resources)
}

exports.buildTrust = buildTrust
