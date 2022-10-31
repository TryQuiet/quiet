import { InitCommunityPayload } from '@quiet/state-manager'
import { Command } from 'commander'
import { INIT_COMMUNITY_DATA, readPersistentData } from './common/utils'
import { ConnectionsManager } from './libp2p/connectionsManager'

import logger from './logger'
const log = logger('conn')

export const runBackend = async (): Promise<any> => {
  // Enable triggering push notifications
  process.env['BACKEND'] = 'mobile'
  process.env['CONNECTION_TIME'] = (new Date().getTime() / 1000).toString() // Get time in seconds

  const program = new Command()

  program
  .requiredOption('-d, --appDataPath <appDataPath>', 'app data path')
  .requiredOption('-p, --dataPort <dataPort>', 'data port')
  .requiredOption('-t, --httpTunnelPort <httpTunnelPort>', 'httpTunnelPort')
  .requiredOption('-s, --socksPort <socksPort>', 'socks port')
  .requiredOption('-c, --controlPort <controlPort>', 'control port')
  .requiredOption('-a, --torPath <torPath>', 'tor binary path')

  program.parse(process.argv)
  const options = program.opts()

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    agentPort: options.socksPort,
    httpTunnelPort: options.httpTunnelPort,
    socketIOPort: options.dataPort,
    options: {
      env: {
        appDataPath: options.appDataPath,
        resourcesPath: options.torPath
      },
      createPaths: false,
      spawnTor: true,
      torControlPort: options.controlPort
    }
  })

  await connectionsManager.init()

  const initCommunityPayload: InitCommunityPayload = readPersistentData(INIT_COMMUNITY_DATA)
  await connectionsManager.ioProxy.launchCommunity(initCommunityPayload)
}

runBackend().catch(error => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(error)
})
