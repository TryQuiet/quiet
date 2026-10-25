// Fails when a packaged app-update.yml does not carry the update-verification settings the
// release is supposed to ship with. Usage: node verifyUpdateConfig.cjs <app-update.yml> [win|other]
const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')
const { build } = require('../package.json')

const expectedPublishers = () => [].concat(build.win?.signtoolOptions?.publisherName ?? [])

const problems = (config, platform) => {
  const found = []
  if (config?.provider !== 's3') found.push(`provider is ${JSON.stringify(config?.provider)}, expected s3`)
  for (const key of ['url', 'endpoint']) {
    if (config?.[key] != null && !String(config[key]).startsWith('https://')) {
      found.push(`${key} ${JSON.stringify(config[key])} is not https`)
    }
  }
  if (platform === 'win') {
    const pinned = expectedPublishers()
    const actual = [].concat(config?.publisherName ?? [])
    if (pinned.length === 0) found.push('package.json does not pin win.signtoolOptions.publisherName')
    if (actual.length === 0) found.push('publisherName is missing: Windows installers would not be signature-checked')
    else if (JSON.stringify(actual) !== JSON.stringify(pinned)) {
      found.push(`publisherName ${JSON.stringify(actual)} differs from package.json ${JSON.stringify(pinned)}`)
    }
  }
  return found
}

module.exports = { problems }

if (require.main === module) {
  const [file, platform = 'other'] = process.argv.slice(2)
  if (!file) {
    console.error('usage: verifyUpdateConfig.cjs <app-update.yml> [win|other]')
    process.exit(2)
  }
  const found = problems(yaml.load(fs.readFileSync(path.resolve(file), 'utf8')), platform)
  if (found.length > 0) {
    for (const problem of found) console.error(`app-update.yml: ${problem}`)
    process.exit(1)
  }
  console.log(`${file}: update verification settings OK`)
}
