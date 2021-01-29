import { Tor } from 'tor-manager'
import IPFS from 'ipfs'
import OrbitDB from 'orbit-db'
import { ConnectionsManager } from './libp2p/connectionsManager'
import * as path from 'path'
import * as os from 'os'

interface IChannel {
  key: string
}

const channelAddress =
  '/orbitdb/zdpuAmqqhvij9w3wqbSEam9p3V6HaPKDKUHTsfREnYCFiWAm3/zbay-public-channels'

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
    // const staticOnionAddress = `PT0gZWQyNTUxOXYxLXNlY3JldDogdHlwZTAgPT0AAADQZeSBmBABj5X+4zo98d+zOfFEygXVYajYaTzthFtLa4muclClSkstifM4SQsaJlFkJN//FZsBfMSLTDPubgCP`
    service1 = tor.getServiceAddress(7788)
  } catch (e) {
    service1 = (await tor.addService({ port: 7788 })).address
  }
  console.log('service1', service1)
  const connectonsManager = new ConnectionsManager({
    port: 7788,
    host: service1,
    agentHost: 'localhost',
    agentPort: 9050
  })
  await connectonsManager.initializeNode()

  const io = {
    emit: (name: string, event: object) =>
      console.log('emit', { name, event: JSON.stringify(event, null, 2) })
  }
  await connectonsManager.subscribeForTopic('abcd', io)
  setInterval(async () => {
    const message = {
      id: 'a',
      type: 1,
      signature: 'sig',
      createdAt: new Date().getTime(),
      r: 2,
      message: 'This is message',
      typeIndicator: 0
    }
    console.log('here')
    await connectonsManager.sendMessage('abcd', io, message)
  }, 3000)
}

main()
