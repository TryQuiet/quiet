import { Command } from 'commander'
import { ConnectionsManager } from './libp2p/connectionsManager'

import logger from './logger'
const log = logger('conn')

export const runBackend = async (): Promise<any> => {
  // Enable triggering push notifications
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

  const program = new Command()

  program
  .requiredOption('-dpth, --dataPath <adataPath>', 'data directory path')
  .requiredOption('-dprt, --dataPort <dataPort>', 'data port')
  .option('-t, --torBinary <torBinary>', 'tor binary path')
  .option('-ac, --authCookie <authCookie>', 'tor authentication cookie')
  .option('-cp, --controlPort <controlPort>', 'tor control port')

  program.parse(process.argv)
  const options = program.opts()

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    socketIOPort: options.dataPort,
    options: {
      env: {
        appDataPath: options.dataPath,
        resourcesPath: options.torBinary
      },
      createPaths: false,
    }
  })

  await connectionsManager.init()
}

runBackend().catch(error => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(error)
})
