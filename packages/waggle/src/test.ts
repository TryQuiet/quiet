/* tslint:disable */
import * as path from 'path'
import * as os from 'os'
import PeerId from 'peer-id'
import * as fs from 'fs'
import { Tor } from './index'
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
  // await tor.addService({ port: 9418 })
  // await tor.addService({ port: 7766 })
  // await tor.addService({ port: 7767 })
  const address1 = tor.getServiceAddress(7766)
  const address2 = tor.getServiceAddress(7767)
  const address3 = tor.getServiceAddress(9418)
  // await tor.addService({ port: 7757 })

  // console.log(address1, 'address')
  // console.log(address2, 'address')

  // const address2 = tor.getServiceAddress(7757)
  // const address3 = tor.getServiceAddress(7757)
  // await tor.addService({ port: 7756 })
  // await tor.addService({ port: 7757 })
  // const address4 = tor.getServiceAddress(7758)
  // try 
  //   // await tor.addService({ port: 7755 })
  //   // await tor.addService({ port: 7756 },
  // await tor.addService({ port: 7758 })
  // address = tor.getServiceAddress(7757)
  //   console.log('address', address)
  // } catch (e) {
  //   console.log('no default service')
  // }
  // jwfvburxit5aym7syf4wskxthjeakwhjdg6f5tktr446ixg556kohmid.onion 7766
  const startLibp2p = async (add1, add2, add3) => {
    console.log(add1, 'hejo')
    // console.log(add1)
    const git = new Git()
    await git.init()
    await git.createRepository('test-address')
    await git.spawnGitDaemon()
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
    // await git.pullChanges('v455fir5uzm6ubmnmgzmk2orhj6xuucvxdrggc4zpvg6cgszpbvuomad.onion', 'test-address', 1607682301253)
    console.log('start sending')
    await connectionsManager1.startSendingMessages('test-address', git)
    console.log('sending done')
    // // const testOnionFromNetwork = await connectionsManager1.getOnionAddress(elo)
    // try {
    //   const key = new TextEncoder().encode(`jwfvburxit5aym7syf4wskxthjeakwhjdg6f5tktr446ixg556kohmid.onion`)
    //   console.log('testing', key)
    //   await connectionsManager1.publishOnionAddress(elo, key)
    // } catch (e) {
    //   console.log('error', e)
    // }
    // const connectionsManager2 = new ConnectionsManager({ port: 7788, host: add1, agentHost: 'localhost', agentPort: 9050 })
    // const node1 = await connectionsManager1.initializeNode()
    // await connectionsManager1.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address', git })
    // const elo = await connectionsManager1.createOnionPeer(testPeerId)
    // try {
    //   await connectionsManager1.publishOnionAddress(elo, 'jwfvburxit5aym7syf4wskxthjeakwhjdg6f5tktr446ixg556kohmid.onion')
    // } catch (e) {
    //   console.log('error', e)
    // }
    // // console.log('nodetest', node2.address)
    // const git = new Git()
    // await git.init()
    // await git.createRepository('test-address')
    // const connectionsManager1 = new ConnectionsManager({ port: 7766, host: add1, agentHost: 'localhost', agentPort: 9050 })
    // const node1 = await connectionsManager1.initializeNode()
    // await connectionsManager1.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address', git })
    // console.log('nodetest', node1.address)
    // await sleep(1 * 30000)
    // console.log('start sending')
    // connectionsManager1.startSendingMessages('test-address', node1.peerId)
    // console.log('sending done')

    // await sleep(20000)

    // const connectionsManager2 = new ConnectionsManager({ port: 7757, host: add2, agentHost: 'localhost', agentPort: 9050 })
    // const node2 = await connectionsManager2.initializeNode()
    // await connectionsManager2.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
    // console.log('nodetest', node2.address)

    // const connectionsManager3 = new ConnectionsManager({ port: 7757, host: add3, agentHost: 'localhost', agentPort: 9050 })
    // const node3 = await connectionsManager3.initializeNode()
    // await connectionsManager3.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
    // // await connectionsManager3.connectToNetwork(node1.address)
    // console.log('nodetest', node3.address)

    // await sleep(10000)

    // const connectionsManager4 = new ConnectionsManager({ port: 7758, host: add4, agentHost: 'localhost', agentPort: 9050 })
    // const node4 = await connectionsManager4.initializeNode()
    // await connectionsManager4.subscribeForTopic({topic: '/libp2p/example/chat/1.0.0', channelAddress: 'test-address' })
    // await connectionsManager4.connectToNetwork(node2.address)
    // console.log('nodetest', node4.address)
    // await connectionsManager.connectToNetwork('/dns4/z33bvb7dtxivj7ymovqunfjrubxgrdtcqtmdeuaewmjo2wtwl7o5i5qd.onion/tcp/7755/ws/p2p/QmPqQsac5onf8mfGr3QbGsHYEUyGApanMmCHpLovFh8kq1')
    // await connectionsManager.listenForInput('test-address')
  }

  await startLibp2p(address1, address2, address3)
  // if (address) {
  //   await startLibp2p(address)
  // } else {
  //   const { address: newOnionAddress } = await tor.addService({ port: 7755 })
  //   await startLibp2p(newOnionAddress)
  // }
  // await startLibp2p(address1)
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