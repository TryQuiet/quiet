import { Tor } from 'tor-manager'
import { DataServer } from './socket/DataServer'
import { Git } from './git/index'
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
  const tor = new Tor({ torPath, settingsPath, options: {
    env: {
      LD_LIBRARY_PATH: pathDevLib,
      HOME: os.homedir()
    }
  } })
  await tor.init()
  let service1
  let service2
  try {
    // const staticOnionAddress = `PT0gZWQyNTUxOXYxLXNlY3JldDogdHlwZTAgPT0AAADQZeSBmBABj5X+4zo98d+zOfFEygXVYajYaTzthFtLa4muclClSkstifM4SQsaJlFkJN//FZsBfMSLTDPubgCP`
    service1 = await tor.getServiceAddress(7788)
    service2 = await tor.getServiceAddress(7799)
  } catch (e) {
    service1 = await (await tor.addService({ port: 7788 })).address
    service2 = await (await tor.addService({ port: 7799 })).address
  }
  console.log('service1', service1)
  console.log('service2', service2)

  const git = new Git('test', 'test', 'test')
  await git.init()
  await git.spawnGitDaemon()

  const dataServer = new DataServer()
  dataServer.listen()
  const peerId1 = fs.readFileSync('peerId1.json')
  const peerId2 = fs.readFileSync('peerId2.json')
  const parsedId1 = JSON.parse(peerId1.toString()) as PeerId.JSONPeerId
  const parsedId2 = JSON.parse(peerId2.toString()) as PeerId.JSONPeerId
  const peerId1Restored = await PeerId.createFromJSON(parsedId1)
  const peerId2Restored = await PeerId.createFromJSON(parsedId2)
  const connectonsManager = new ConnectionsManager({ port: 7788, host: service1, agentHost: 'localhost', agentPort: 9050 })
  const node = await connectonsManager.initializeNode()
  console.log(node, 'node')
  const peerIdOnionAddress = await connectonsManager.createOnionPeerId(node.peerId)
  const key = new TextEncoder().encode(service2)
  await connectonsManager.publishOnionAddress(peerIdOnionAddress, key)
  initListeners(dataServer.io, connectonsManager, git)
}

main()