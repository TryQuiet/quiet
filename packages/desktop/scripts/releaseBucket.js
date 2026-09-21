const fs = require('node:fs')
const path = require('node:path')

function releaseBucket(version, action) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(version)
  if (!match || (match[4] && match[4].split('.').some(part => /^0\d+$/.test(part)))) {
    throw new Error(`Invalid desktop release version: ${version}`)
  }
  if (action !== 'released' && action !== 'prereleased') {
    throw new Error(`Unsupported release action: ${action}`)
  }
  if (Boolean(match[4]) !== (action === 'prereleased')) {
    throw new Error(`Desktop version ${version} does not match release action ${action}`)
  }
  return action === 'released' ? `quiet.${match[1]}.x` : 'test.quiet'
}

function main() {
  if (process.env.GITHUB_EVENT_NAME !== 'release') {
    throw new Error('Update buckets can only be selected for release events')
  }
  const pkg = JSON.parse(fs.readFileSync(process.argv[2] || path.join(__dirname, '../package.json'), 'utf8'))
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  if (event.release?.tag_name !== `@quiet/desktop@${pkg.version}`) {
    throw new Error('Desktop release tag must match packages/desktop/package.json version')
  }
  const bucket = releaseBucket(pkg.version, event.action)
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `bucket=${bucket}\n`)
  console.log(`Desktop ${pkg.version}: ${bucket}`)
}

module.exports = { releaseBucket }

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
