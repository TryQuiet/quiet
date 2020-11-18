import * as path from 'path'
import * as os from 'os'
import { Tor } from './index'
import { ConnectionsManager } from './connectionsManager'

const main = async () => {
  const torPath = `${process.cwd()}/tor/mac/tor`
  const settingsPath = `${process.cwd()}/tor/torrc`
  const pathDevLib = path.join.apply(null, [process.cwd(), 'tor'])
  const tor = new Tor({ torPath, settingsPath, options: {
    env: {
      LD_LIBRARY_PATH: pathDevLib,
      HOME: os.homedir()
    }
  } })
  await tor.init()
  let address = null
  try {
    address = tor.getServiceAddress(7755)
    console.log('address', address)
  } catch (e) {
    console.log('no default service')
  }
  const startLibp2p = async (onionAddress) => {
    const connectionsManager = new ConnectionsManager({ port: 7755, host: onionAddress, agentHost: 'localhost', agentPort: 9050 })
    const node = await connectionsManager.initializeNode()
    await connectionsManager.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
    console.log('nodetest', node.address)
    await connectionsManager.connectToNetwork('/dns4/v5nvvfcfpceu6z6hao576ecbfvxin5ahmpbf6rovxbks2kevdxusfayd.onion/tcp/7799/ws/p2p/QmYi5ZF7RidnErUnYPfWht5LisVtBt7NryDqVXttRtcDF2')
    await connectionsManager.listenForInput('test-address')
  }
  if (address) {
    await startLibp2p(address)
  } else {
    const { address: newOnionAddress } = await tor.addService({ port: 7755 })
    await startLibp2p(newOnionAddress)
  }
  // const connectionsManager = new ConnectionsManager({ port, host: address, agentHost: 'localhost', agentPort: 9050 })
  // const { port, address } = await tor.addService({ port: 7755 })
  // const connectionsManager = new ConnectionsManager({ port, host: address, agentHost: 'localhost', agentPort: 9050 })
  // const node = await connectionsManager.initializeNode()
  // console.log('nodetest', node.address)
  // await connectionsManager.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
  // await connectionsManager.connectToNetwork('/dns4/4ko6lemjgq5xligdnytwxpmu2qx3mk5rbjqlarew6p33sllehjkfjxid.onion/tcp/7757/ws/p2p/QmQZnapdXBPw2A6J4Gji1J5h5yVUwDNcs2sypgYWu6sAPq')
  // await connectionsManager.listenForInput('test-address')
  // await tor.killService({ port: 7756 })
  // await tor.killService({ port: 7757 })
  // const { port, address } = await tor.addService({ port: 7755 })
  // const connectionsManager = new ConnectionsManager({ port, host: address, agentHost: 'localhost', agentPort: 9050 })
  // const node = await connectionsManager.initializeNode()
  // console.log('nodetest', node.address)
  // await connectionsManager.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
  // await connectionsManager.connectToNetwork('/dns4/hkzdoy3s62qqnrmhf4cyed25ty2hxlojmenxemaj2thidgwlfcoexyid.onion/tcp/7755/ws/p2p/QmTWVfrJLxXTbqBazwrFexMfh8VSQE2iv2tfhcAy7xWyfK')
  // await connectionsManager.listenForInput('test-address')
  // // console.log(tor.getServiceAddress(8888))
  // await tor.killService({ port: 8888 })
  // await tor.kill()
}
main()