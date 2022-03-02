const fs = require('fs')
const path = require('path')
// Note: this config file assumes that the app is present in e2e-tests directory

const getAppName = () => {
  const envs = {
    linux: '.appimage',
    win32: '.exe'
  }
  const files = fs.readdirSync('.')
  const apps = files.filter((file) => {
    return path.extname(file).toLowerCase() === envs[process.platform]
  })
  if (!apps) throw Error('NO APPS FOUND')
  return apps[0]
}

module.exports = {
  mainWindowUrl: '/dist/main/index.html#/',
  electronPath: `${getAppName()}`,
  relativePageUrls: true,
  openDevTools: true,
}
