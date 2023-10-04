const os = require('os')
const child_process = require('child_process')
console.log('copyfonts shell', os.userInfo().shell)
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  child_process.execSync('cp src/renderer/fonts/* dist/main')
} else {
  child_process.execSync('xcopy src\\renderer\\fonts\\* dist\\main /Y')
}
