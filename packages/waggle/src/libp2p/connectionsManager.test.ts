import { ConnectionsManager } from './connectionsManager'
import { DataServer } from '../socket/DataServer'
import { ZBAY_DIR_PATH } from '../constants'
import { Tor } from '../torManager/index'
import { getPorts } from '../utils'
import path from 'path'
import os from 'os'
jest.setTimeout(150_000)

test('start and close connectionsManager', async () => {
  const ports = await getPorts()
  const torPath = `${process.cwd()}/tor/tor`
  const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
  const dataServer = new DataServer(ports.dataServer)
  await dataServer.listen()
  const tor = new Tor({
    socksPort: ports.socksPort,
    torPath,
    appDataPath: ZBAY_DIR_PATH,
    controlPort: 9051,
    options: {
      env: {
        LD_LIBRARY_PATH: pathDevLib,
        HOME: os.homedir()
      },
      detached: true
    }
  })
  await tor.init()
  const service1 = await tor.createNewHiddenService(9799, 9799)

  const connectionsManager = new ConnectionsManager({
    port: ports.libp2pHiddenService,
    host: `${service1.onionAddress}.onion`,
    agentHost: 'localhost',
    agentPort: ports.socksPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: `${ZBAY_DIR_PATH}`
      }
    }
  })

  await connectionsManager.initializeNode()
  await connectionsManager.initStorage()
  await connectionsManager.closeStorage()
  await connectionsManager.stopLibp2p()
  await dataServer.close()
  await tor.kill()
})
