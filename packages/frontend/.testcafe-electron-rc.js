const pjson = require('./package.json')

function getMainWindowUrl() {
  return `/dist/main/index.html#/`;  // This works only with hacking get-config.js
}

const getAppName = () => {
  const envs = {
    linux: 'AppImage',
    win32: 'exe'
  }
  return `${pjson.productName}-${pjson.version}.${envs[process.platform]}`
}

module.exports = {
  mainWindowUrl: getMainWindowUrl(),
//    get mainWindowUrl() {
//        console.trace('Here getter', getMainWindowUrl())
//        return getMainWindowUrl();
//    },
//    set mainWindowUrl(value) {
//     console.trace('wtf? why is something calling this?', value);
//  },
   electronPath: `./dist/${getAppName()}`,
  //  openDevTools: true
}

// module.exports = {
//   mainWindowUrl: `./dist/main/index.html#/`,
//   electronPath: `./dist/${getAppName()}`,
//   // openDevTools: true,
// }