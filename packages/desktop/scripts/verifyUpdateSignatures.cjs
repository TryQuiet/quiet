// Fails unless every installer / AppImage in a build directory has a `.sig` that the app's public
// keys accept for the package version. Run after electron-builder in the release jobs.
// Usage: node verifyUpdateSignatures.cjs <dist-dir>
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { loadPublicKeys, updateStatement } = require('./updateSigning.cjs')
const { version } = require('../package.json')

const signedFiles = dir => fs.readdirSync(dir).filter(name => /\.(exe|AppImage)$/.test(name))

const problems = (dir, publicKeys = loadPublicKeys()) => {
  const found = []
  const files = signedFiles(dir)
  if (files.length === 0) found.push(`no .exe or .AppImage in ${dir}`)
  for (const name of files) {
    const file = path.join(dir, name)
    if (!fs.existsSync(`${file}.sig`)) {
      found.push(`${name}: no .sig next to it`)
      continue
    }
    const sha512 = crypto.createHash('sha512').update(fs.readFileSync(file)).digest('base64')
    const statement = Buffer.from(updateStatement(version, name, sha512))
    const signature = Buffer.from(fs.readFileSync(`${file}.sig`, 'utf8').trim(), 'base64')
    const valid = publicKeys.some(key =>
      crypto.verify(
        null,
        statement,
        crypto.createPublicKey({ key: Buffer.from(key, 'base64'), format: 'der', type: 'spki' }),
        signature
      )
    )
    if (!valid) found.push(`${name}: signature is not valid for version ${version} under any shipped key`)
  }
  return found
}

module.exports = { problems }

if (require.main === module) {
  const found = problems(path.resolve(process.argv[2] ?? 'dist'))
  if (found.length > 0) {
    for (const problem of found) console.error(`update signatures: ${problem}`)
    process.exit(1)
  }
  console.log('update signatures OK')
}
