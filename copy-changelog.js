const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname)
const packagesDir = path.resolve(rootDir, 'packages')

const rootChangelog = fs.readFileSync(path.resolve(rootDir, 'CHANGELOG.md'), 'utf8')

const packages = fs.readdirSync(packagesDir).filter(package => ['desktop', 'mobile'].includes(package))

packages.forEach(package => {
  fs.writeFileSync(path.resolve(packagesDir, package, 'CHANGELOG.md'), rootChangelog)
})
