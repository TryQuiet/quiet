//mkdir .\\nodejs-assets\\nodejs-project || cd . && xcopy ..\\backend\\lib\\bundle.cjs .\\nodejs-assets\\nodejs-project\\ /Y
const os = require('os')
const child_process = require('child_process')
console.log('prepare-backend-assets shell', os.userInfo().shell)
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  child_process.execSync('mkdir -p ./nodejs-assets/nodejs-project && cp ../backend/lib/bundle.cjs ./nodejs-assets/nodejs-project/bundle.cjs')
} else {
  child_process.execSync('mkdir .\\nodejs-assets\\nodejs-project || cd . && xcopy ..\\backend\\lib\\bundle.cjs .\\nodejs-assets\\nodejs-project\\ /Y')
}
