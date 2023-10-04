const os = require('os')
const child_process = require('child_process')
console.log('shell', os.userInfo().shell)
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  child_process.execSync('webpack --env mode=development && cp ./lib/bundle.cjs ../backend-bundle/bundle.cjs')
} else {
  child_process.execSync('webpack --env mode=development && xcopy .\\lib\\bundle.cjs ..\\backend-bundle\\ /Y')
}
