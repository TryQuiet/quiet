const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

const pathDev = path.join.apply(null, [process.cwd(), 'tor/tor'])
const pathDevSettings = path.join.apply(null, [process.cwd(), 'tor/torrc'])
const pathProd = path.join.apply(null, [process.resourcesPath, 'tor/tor'])
const pathProdSettings = path.join.apply(null, [
  process.resourcesPath,
  'tor/torrc'
])
console.log()
const os = require('os')

console.log(`${os.homedir()}/zbay_tor`)
const spawn = require('child_process').spawn
const spawnTor = () =>
  new Promise((resolve, reject) => {
    var fs = require('fs')
    const data = fs.readFileSync(
      isDev ? pathDevSettings : pathProdSettings,
      'utf8'
    )
    const result = data.replace(/PATH_TO_CHANGE/g, `${os.homedir()}/zbay_tor`)
    fs.writeFileSync(isDev ? pathDevSettings : `${os.homedir()}/torrc`, result, 'utf8')

    const proc = spawn(isDev ? pathDev : pathProd, [
      '-f',
      isDev ? pathDevSettings : `${os.homedir()}/torrc`
    ])
    const id = setTimeout(() => {
      resolve(null)
    }, 8000)
    proc.stdout.on('data', data => {
      console.log(`stdout: ${data}`)
      if (data.includes('100%')) {
        console.log(data)
        clearTimeout(id)
        resolve(proc)
      }
    })
    proc.stderr.on('data', data => {
      console.error(`grep stderr: ${data}`)
    })
    proc.on('close', code => {
      if (code !== 0) {
        console.log(`ps process exited with code ${code}`)
      }
    })
  })
const getOnionAddress = () => {
  var fs = require('fs')
  const address = fs.readFileSync(`${os.homedir()}/zbay_tor/hostname`, 'utf8')
  return address
}
module.exports = { spawnTor, getOnionAddress }
