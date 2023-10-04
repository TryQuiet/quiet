const os = require('os')
const child_process = require('child_process')
console.log('applyPatches shell', os.userInfo().shell)
if (process.platform !== 'win32' || os.userInfo().shell !== null) {
  child_process.execSync('patch -f -p0 < ./electron-fetch.patch || true && patch -f -p0 --forward --binary < ./parse-duration.patch || true && patch -f -p0 --forward --binary < ./parse-duration-esm.patch || true')
} else {
  child_process.execSync('git apply ./electron-fetch-git.patch --whitespace=fix --reject --verbose --no-index --ignore-space-change --inaccurate-eof || cd .')
}
