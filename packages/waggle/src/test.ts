/* tslint:disable */
import * as path from 'path'
import * as os from 'os'
import PeerId from 'peer-id'
import * as fs from 'fs'
import { Tor } from 'tor-manager'
import { ConnectionsManager } from './connectionsManager'
import { sleep } from './sleep'
import { Git } from '../git/index'

const main = async () => {
  const torPath = `${process.cwd()}/tor/tor`
  const settingsPath = `${process.cwd()}/tor/torrc`
  const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
  console.log(settingsPath, 'path')
  const tor = new Tor({ torPath, settingsPath, options: {
    env: {
      LD_LIBRARY_PATH: pathDevLib,
      HOME: os.homedir()
    }
  } })
  await tor.init()
  let address1
  let address3
  try {
    address1 = tor.getServiceAddress(7766)
    address3 = tor.getServiceAddress(9418)
  } catch (e) {
    address1 = await tor.addService({ port: 7766 })
    address3 = await tor.addService({ port: 9418 })
  }
  console.log('test', address1, address3)
  const startLibp2p = async (add1, add3) => {
    const git = new Git()
    await git.init()
    await git.createRepository('test-address')
    await git.spawnGitDaemon()
    await git.pullChanges(add3, 'test-address')
    const peerId1 = fs.readFileSync('peerId1.json')
    const peerId2 = fs.readFileSync('peerId2.json')
    const parsedId1 = JSON.parse(peerId1.toString()) as PeerId.JSONPeerId
    const parsedId2 = JSON.parse(peerId2.toString()) as PeerId.JSONPeerId
    const peerId1Restored = await PeerId.createFromJSON(parsedId1)
    const peerId2Restored = await PeerId.createFromJSON(parsedId2)
    const connectionsManager1 = new ConnectionsManager({ port: 7766, host: add1, agentHost: 'localhost', agentPort: 9050 })
    const node1 = await connectionsManager1.initializeNode(peerId1Restored)
    await connectionsManager1.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address', git })
    const elo = await connectionsManager1.createOnionPeerId(node1.peerId)
    console.log('node1', node1.address, node1.peerId)
    const key = new TextEncoder().encode(add3)
    await connectionsManager1.publishOnionAddress(elo, key)
    await sleep(0.5 * 60000)
    console.log('start sending')
    await connectionsManager1.startSendingMessages('test-address', git)
    console.log('sending done')
  }

  await startLibp2p(address1, address3)
}
main()