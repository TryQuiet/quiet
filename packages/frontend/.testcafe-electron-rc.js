const pjson = require('./package.json')

function getMainWindowUrl() {
  return `${process.env.APPDIR}/dist/main/index.html#/`;
}

const getAppName = () => {
  const envs = {
    linux: 'AppImage',
    win32: 'exe'
  }
  return `${pjson.productName}-${pjson.version}.${envs[process.platform]}`
}

module.exports = {
   get mainWindowUrl() {
       console.trace('Here getter', getMainWindowUrl())
       return getMainWindowUrl();
   },
   set mainWindowUrl(value) {
    console.trace('wtf? why is something calling this?', value);
 },
   electronPath: `./dist/${getAppName()}`,
}

// module.exports = {
//   mainWindowUrl: `./dist/main/index.html#/`,
//   electronPath: `./dist/${getAppName()}`,
//   // openDevTools: true,
// }