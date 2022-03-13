const fs = require('fs')
const path = require('path')
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv)).argv

const getElectronAppPath = () => {
  // Note: this config file assumes that the executable (app) is present in e2e-tests directory
  if (argv.appPath) {
    console.log(`Using app path from arguments: ${argv.appPath}`)
    return argv.appPath
  }

  const envs = {
    linux: '.appimage',
    win32: '.exe'
  }
  const files = fs.readdirSync('.')
  const apps = files.filter((file) => {
    return path.extname(file).toLowerCase() === envs[process.platform]
  })
  if (!apps) throw Error('NO APPS FOUND')

  console.log(`Using app from current directory: ${apps[0]}`)
  return apps[0]
}

module.exports = {
  mainWindowUrl: path.join('/dist', 'main', 'index.html#/'),
  electronPath: `${getElectronAppPath()}`,
  relativePageUrls: true,
  openDevTools: true,
}
