const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const fs = require('fs')
const path = require('path')

const ensureAppIsDownloaded = () => {
  // const paths = [
  //   path('')
  //   path.join('..', 'frontend', 'dist', '')
  // ]
  // if (!fs.existsSync()) {
}

const runTest = async () => {
  for (let i=1; i<=3; i++) {
    console.log(`Starting ${i} test`)
    const output = await exec('npm run test:smoke')
    console.log(output.stdout.trim())
    console.log(output.stderr.trim())
    console.log(`Finished ${i} test`)
  }
}

runTest().then((data) => {
  console.log('DONE', data)
})