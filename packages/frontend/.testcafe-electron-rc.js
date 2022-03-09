const pjson = require('./package.json')

const getAppName = () => {
  const envs = {
    linux: 'AppImage',
    win32: 'exe'
  }
  return `${pjson.productName}-${pjson.version}.${envs[process.platform]}`
}

module.exports = {
  mainWindowUrl: '/dist/main/index.html#/',
  electronPath: `./dist/${getAppName()}`,
  relativePageUrls: true,
  // openDevTools: true,
}
