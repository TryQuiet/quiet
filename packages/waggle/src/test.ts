import * as path from 'path'
import * as os from 'os'
import { Tor } from './index'
import { ConnectionsManager } from './createLibp2p'

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
  const { port, address } = await tor.addService({ port: 7755 })
  // await tor.addService({ port: 7756 })
  const connectionsManager = new ConnectionsManager({ port, host: address, agentHost: 'localhost', agentPort: 9050 })
  const node = await connectionsManager.initializeNode()
  console.log('nodetest', node.address)
  await connectionsManager.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
  // await connectionsManager.connectToNetwork('/dns4/hkzdoy3s62qqnrmhf4cyed25ty2hxlojmenxemaj2thidgwlfcoexyid.onion/tcp/7755/ws/p2p/QmTWVfrJLxXTbqBazwrFexMfh8VSQE2iv2tfhcAy7xWyfK')
  await connectionsManager.listenForInput('test-address')
  // // console.log(tor.getServiceAddress(8888))
  // await tor.killService({ port: 8888 })
  // await tor.kill()
}
main()