import { Tor } from './torManager'
import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import initListeners from './socket/listeners/'
import * as path from 'path'
import * as os from 'os'
import fs from 'fs'
import PeerId from 'peer-id'

const main = async () => {
  const torPath = `${process.cwd()}/tor/tor`
  const settingsPath = `${process.cwd()}/tor/torrc`
  const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
  const tor = new Tor({
    torPath,
    settingsPath,
    options: {
      env: {
        LD_LIBRARY_PATH: pathDevLib,
        HOME: os.homedir()
      }
    }
  })
  await tor.init()
  let service1
  try {
    service1 = await tor.getServiceAddress(7788)
  } catch (e) {
    service1 = await tor.addOnion({ virtPort: 7788, targetPort: 7788, privKey: process.env.HIDDEN_SERVICE_SECRET })
  }
  console.log('service1', service1)

  const dataServer = new DataServer()
  dataServer.listen()
  const peerId = fs.readFileSync('entryNodePeerId.json')
  const parsedId = JSON.parse(peerId.toString()) as PeerId.JSONPeerId
  const peerIdRestored = await PeerId.createFromJSON(parsedId)
  const connectonsManager = new ConnectionsManager({
    port: 7788,
    host: service1,
    agentHost: 'localhost',
    agentPort: 9050
  })
  const node = await connectonsManager.initializeNode(peerIdRestored)
  console.log(node, 'node')

  initListeners(dataServer.io, connectonsManager)
}

main()
