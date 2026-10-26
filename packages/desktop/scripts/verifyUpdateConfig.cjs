// Fails when a packaged app-update.yml does not carry the update feed settings the release is
// supposed to ship with. Usage: node verifyUpdateConfig.cjs <app-update.yml>
const fs = require('node:fs')
const path = require('node:path')

const problems = config => {
  const found = []
  if (config?.provider !== 's3') found.push(`provider is ${JSON.stringify(config?.provider)}, expected s3`)
  for (const key of ['url', 'endpoint']) {
    if (config?.[key] != null && !String(config[key]).startsWith('https://')) {
      found.push(`${key} ${JSON.stringify(config[key])} is not https`)
    }
  }
  return found
}

module.exports = { problems }

if (require.main === module) {
  const [file] = process.argv.slice(2)
  if (!file) {
    console.error('usage: verifyUpdateConfig.cjs <app-update.yml>')
    process.exit(2)
  }
  const yaml = require('js-yaml')
  const found = problems(yaml.load(fs.readFileSync(path.resolve(file), 'utf8')))
  if (found.length > 0) {
    for (const problem of found) console.error(`app-update.yml: ${problem}`)
    process.exit(1)
  }
  console.log(`${file}: update feed settings OK`)
}
