const os = require('os')
const child_process = require('child_process')
console.log('override-dlopen shell', os.userInfo().shell)
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  child_process.execSync('cd ./nodejs-assets/nodejs-project && cp ../override-dlopen-paths-preload.js ./ && cp ../override-dlopen-paths-data.json ./')
} else {
  child_process.execSync('cd ./nodejs-assets/nodejs-project && xcopy ..\\override-dlopen-paths-preload.js .\\ /Y && xcopy ..\\override-dlopen-paths-data.json .\\ /Y')
}
