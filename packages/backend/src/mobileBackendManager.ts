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
  .option('-htp, --httpTunnelPort <httpTunnelPort>', 'http tunnel port')

  program.parse(process.argv)
  const options = program.opts()

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    socketIOPort: options.dataPort,
    httpTunnelPort: options.httpTunnelPort ? options.httpTunnelPort : null,
    torAuthCookie: options.authCookie ? options.authCookie : null,
    torControlPort: options.controlPort ? options.controlPort : null,
    torBinaryPath: options.torBinary ? options.torBinary : null,
    torResourcesPath: null,
    options: {
      env: {
        appDataPath: options.dataPath,
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
