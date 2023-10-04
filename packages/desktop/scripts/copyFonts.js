const os = require('os')
const child_process = require('child_process')
const path = require('path')
console.log('copyfonts shell', os.userInfo().shell)
const source = path.join(__dirname, '..', 'src', 'renderer', 'fonts')
const target = path.join(__dirname, '..', 'dist', 'main')
let command = ''
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  command = `cp ${source} ${target}`
} else {
  command = `xcopy ${source} ${target} /Y`
}
child_process.execSync(command, { stdio: 'inherit' })
