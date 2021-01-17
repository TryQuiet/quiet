import electronStore from '../src/shared/electronStore'

const path = require('path')
const fp = require('find-free-port')

const isDev = process.env.NODE_ENV === 'development'

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

export const getPorts = async (): Promise<{ socksPort: number, httpTunnelPort: number }> => {
  const [socksPort] = await fp(9052)
  const [httpTunnelPort] = await fp(9082)
  return {
    socksPort,
    httpTunnelPort
  }
}

const spawn = require('child_process').spawn
export const spawnTor = async (): Promise<void> => {
  const ports = await getPorts()
  electronStore.set('ports', ports)
  return await new Promise(resolve => {
    const fs = require('fs')
    let data = fs
      .readFileSync(isDev ? pathDevSettings : pathProdSettingsTemplate)
      .toString()
      .split('\n')
    data.splice(
      17,
      1,
      `SocksPort ${ports.socksPort} # Default: Bind to localhost:9050 for local connections.`
    )
    data.splice(18, 1, `HTTPTunnelPort ${ports.httpTunnelPort}`)
    let text = data.join('\n')
    text = text.replace(/PATH_TO_CHANGE/g, path.join.apply(null, [os.homedir(), 'zbay_tor']))
    fs.writeFileSync(
      isDev ? pathDevSettings : path.join.apply(null, [os.homedir(), 'torrc']),
      text,
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
