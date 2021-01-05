const path = require('path')
const fp = require('find-free-port')
const isDev = process.env.NODE_ENV === 'development'

import electronStore from '../src/shared/electronStore'

const pathDev = path.join.apply(null, [process.cwd(), 'tor', 'tor'])
const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
const pathProdLib = path.join.apply(null, [process.resourcesPath, 'tor'])
const pathDevSettings = path.join.apply(null, [process.cwd(), 'tor', 'torrc'])
const pathDevSettingsTemplate = path.join.apply(null, [process.cwd(), 'tor', 'torrcTemplate'])
const pathProd = path.join.apply(null, [process.resourcesPath, 'tor', 'tor'])
const pathProdSettings = path.join.apply(null, [process.resourcesPath, 'tor', 'torrcTemplate'])
const pathProdSettingsTemplate = path.join.apply(null, [
  process.resourcesPath,
  'tor',
  'torrcTemplate'
])
const os = require('os')

export const getPorts = async (): Promise<{ socksPort: number; httpTunnelPort: number }> => {
  let [socksPort] = await fp(9052)
  let [httpTunnelPort] = await fp(9082)
  return {
    socksPort,
    httpTunnelPort
  }
}

const spawn = require('child_process').spawn
export const spawnTor = async () => {
  const ports = await getPorts()
  electronStore.set('ports', ports)
  new Promise(resolve => {
    var fs = require('fs')
    fs.copyFileSync(
      isDev ? pathDevSettingsTemplate : pathProdSettingsTemplate,
      isDev ? pathDevSettings : pathProdSettings
    )
    const data = fs.readFileSync(isDev ? pathDevSettings : pathProdSettings, 'utf8')
    let result = data.replace(/PATH_TO_CHANGE/g, path.join.apply(null, [os.homedir(), 'zbay_tor']))
    result = result.replace(/SOCKS_PORT/g, ports.socksPort)
    result = result.replace(/HTTP_TUNNEL_PORT/g, ports.httpTunnelPort)
    fs.writeFileSync(
      isDev ? pathDevSettings : path.join.apply(null, [os.homedir(), 'torrc']),
      result,
      'utf8'
    )

    const proc = spawn(
      isDev ? pathDev : pathProd,
      ['-f', isDev ? pathDevSettings : path.join.apply(null, [os.homedir(), 'torrc'])],
      {
        env: {
          LD_LIBRARY_PATH: isDev ? pathDevLib : pathProdLib,
          HOME: os.homedir()
        }
      }
    )
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
}

export const getOnionAddress = () => {
  var fs = require('fs')
  const hostnamePath = path.join.apply(null, [os.homedir(), 'zbay_tor/hostname'])
  let address: string = null
  if (fs.existsSync(hostnamePath)) {
    address = fs.readFileSync(hostnamePath, 'utf8')
  } else {
    return getOnionAddress()
  }
  return address
}

export default { spawnTor, getOnionAddress, getPorts }
