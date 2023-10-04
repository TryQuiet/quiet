const os = require('os')
const child_process = require('child_process')
const path = require('path')
console.log('prepare-backend-assets shell', os.userInfo().shell)
const bundleTarget = path.join(__dirname, '..', 'nodejs-assets', 'nodejs-project', 'bundle.cjs')
const bundleTargetDir = path.join(__dirname, '..', 'nodejs-assets', 'nodejs-project')
const bundleSource = path.join(__dirname, '..', '..', 'backend', 'lib', 'bundle.cjs')
let command = ''
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  command = `mkdir -p ${bundleTargetDir} && cp ${bundleSource} ${bundleTarget}`
} else {
  command = `mkdir ${bundleTargetDir} || cd . && xcopy ${bundleSource} ${bundleTargetDir} /Y`
}

child_process.execSync(command, { stdio: 'inherit' })
