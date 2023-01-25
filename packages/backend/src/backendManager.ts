// import backend, { torBinForPlatform, torDirForPlatform } from 'backend-bundle'
import logger from './logger'
import { Command } from 'commander'
import { Crypto } from '@peculiar/webcrypto'
const program = new Command()

import backend, { torBinForPlatform, torDirForPlatform } from './index'

const log = logger('backendManager')

const webcrypto = new Crypto()

//@ts-ignore
global.crypto = webcrypto

program
  .option('-a, --appDataPath <string>', 'Path of application data directory')
  .option('-d, --socketIOPort <number>', 'Socket io data server port')
  .option('-r, --resourcesPath <string>', 'Application resources path')

program.parse(process.argv)
const options = program.opts()

export const runBackend = async () => {
  const isDev = process.env.NODE_ENV === 'development'

  const resourcesPath = isDev ? null : options.resourcesPath.trim()

  console.log('connectionsManager')
  const connectionsManager = new backend.ConnectionsManager({
    socketIOPort: options.socketIOPort,
    torBinaryPath: torBinForPlatform(resourcesPath),
    torResourcesPath: torDirForPlatform(resourcesPath),
    options: {
      env: {
        appDataPath: `${options.appDataPath.trim()}/Quiet`,
      }
}
  })

  process.on('message', async (message) => {
    if (message === 'close') {
      try {
        await connectionsManager.closeAllServices()
      } catch (e) {
        log.error('Error occured while closing backend services', e)
      }
      process.send('closed-services')
    }
  })

  await connectionsManager.init()
}

export const backendVersion = backend.version

runBackend().catch(e => {
  log.error('Error occurred while initializing backend', e)
  throw Error(e.message)
})
