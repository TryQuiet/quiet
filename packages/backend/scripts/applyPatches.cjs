const os = require('os')
const child_process = require('child_process')
const path = require('path')
console.log('applyPatches shell', os.userInfo().shell)
const electronFetchPatch = path.join(__dirname, '..', 'electron-fetch.patch')
const parseDurationPatch = path.join(__dirname, '..', 'parse-duration.patch')
const parseDurationEsmPatch = path.join(__dirname, '..', 'parse-duration-esm.patch')
let command = ''
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  command = `patch -f -p0 < ${electronFetchPatch} || true && patch -f -p0 --forward --binary < ${parseDurationPatch} || true && patch -f -p0 --forward --binary < ${parseDurationEsmPatch} || true`
} else {
  command = `git apply ${electronFetchPatch} --whitespace=fix --reject --verbose --no-index --ignore-space-change --inaccurate-eof || cd .`
}
child_process.execSync(command, { stdio: 'inherit' })
