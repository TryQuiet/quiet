const os = require('os')
const child_process = require('child_process')
const path = require('path')
console.log('shell', os.userInfo().shell)
const bundleTarget = path.join(__dirname, '..', '..', 'backend-bundle', 'bundle.cjs')
const bundleTargetWin = path.join(__dirname, '..', '..', 'backend-bundle')
const bundleSource = path.join(__dirname, '..', 'lib', 'bundle.cjs')
let command = ''
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  command = `webpack --env mode=development && cp ${bundleSource} ${bundleTarget}`
} else {
  command = `webpack --env mode=development && xcopy ${bundleSource} ${bundleTargetWin} /Y`
}
child_process.execSync(command, { stdio: 'inherit' })
