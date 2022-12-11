import { webSockets  } from './index'
import { Multiaddr } from 'multiaddr'
import { Tor } from '../../torManager/index'
import os from 'os'
import * as utils from '../../common/utils'
import HttpsProxyAgent from 'https-proxy-agent'
import { createTmpDir, tmpQuietDirPath } from '../../common/testUtils'
import { createCertificatesTestHelper } from '../tests/client-server'
import { createLibp2pAddress } from '../../common/utils'
import getPort from 'get-port'
import { DirResult } from 'tmp'

jest.setTimeout(120000)

describe('websocketOverTor', () => {
  const upgradeOutbound = jest.fn()
  const upgradeInbound = jest.fn(x => x)
  const removeEventListener = jest.fn()
  const addEventListener = jest.fn()

  let tmpAppDataPath: string
  let tmpDir: DirResult
  let service1: {
    onionAddress: string
    privateKey: string
  }
  let service2: {
    onionAddress: string
    privateKey: string
  }
  let tor: Tor
  let httpTunnelPort: number
  let listener
  let port1Target: number
  let port2Target: number

  beforeAll(async () => {
    jest.clearAllMocks()
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    const port1Arr = await getPort()
    const port2Arr = await getPort()
    port1Target = port1Arr
    port2Target = port2Arr
    const torPath = utils.torBinForPlatform()
    httpTunnelPort = await getPort()
    tor = new Tor({
      torPath,
      appDataPath: tmpAppDataPath,
      httpTunnelPort,
      options: {
        env: {
          LD_LIBRARY_PATH: utils.torDirForPlatform(),
          HOME: os.homedir()
        },
        detached: true
      }
    })
    await tor.init()

    service1 = await tor.createNewHiddenService(port1Target)
    service2 = await tor.createNewHiddenService(port2Target)
  })

  afterAll(async () => {
    await tor.kill()
    tmpDir.removeCallback()
  })

  afterEach(async () => {
    if (listener) {
      await listener.close()
    }
  })

  it.each([
    ['string', String],
    ['array', Array]
  ])('connects successfully with CA passed as %s', async (_name: string, caType: (ca: string) => any) => {
    const pems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)
    // In case test fails on CI, we will be able to conduct test against failing credentials.
    console.log(`serVert ${pems.servCert}`)
    console.log(`servKey ${pems.servKey}`)
    console.log(`ca ${pems.ca}`)
    console.log(`caKey ${pems.ca_key}`)
    console.log(`userCert ${pems.userCert}`)
    console.log(`userKey ${pems.userKey}`)

    const prepareListenerArg = {
      handler: (x) => x,
      upgrader: {
        upgradeOutbound,
        upgradeInbound
      }
    }

    const signal = {
      addEventListener,
      removeEventListener
    }

    const peerId1 = 'Qme5NiSQ6V3cc3nyfYVtkkXDPGBSYEVUNCN5sM4DbyYc7s'
    const peerId2 = 'QmeCWxba5Yk1ZAKogQJsaHXoAermE7PgFZqpqyKNg65cSN'

    const agent = HttpsProxyAgent({ host: 'localhost', port: httpTunnelPort })

    const websocketsOverTorData1 = {
      upgrader: {
        upgradeOutbound,
        upgradeInbound
      },
      websocket: {
        agent,
        cert: pems.servCert,
        key: pems.servKey,
        ca: caType(pems.ca)
      },
      localAddress: createLibp2pAddress(service1.onionAddress, peerId1),
      targetPort: port1Target
    }

    const websocketsOverTorData2 = {
      upgrader: {
        upgradeOutbound,
        upgradeInbound
      },
      websocket: {
        agent,
        cert: pems.userCert,
        key: pems.userKey,
        ca: caType(pems.ca)
      },
      localAddress: createLibp2pAddress(service2.onionAddress, peerId2),
      serverOpts: {},
      targetPort: port2Target
    }
    const multiAddress = new Multiaddr(createLibp2pAddress(service1.onionAddress, peerId1))

    const remoteAddress = new Multiaddr(createLibp2pAddress(service2.onionAddress, peerId2))

    // const ws1 = webSockets(websocketsOverTorData1)()
    // const ws2 = webSockets(websocketsOverTorData2)()

    // listener = await ws1.prepareListener(prepareListenerArg)

    // await listener.listen(multiAddress)

    // const onConnection = jest.fn()
    // listener.on('connection', onConnection)

    // let retryCount = 0

    // const tryDial = async () => {
    //   try {
    //     await ws2.dial(multiAddress, {
    //       signal: signal
    //     })
    //   } catch (e) {
    //     console.log(`catched Error ${e.message as string}, retryCount is ${retryCount}`)
    //     if (retryCount < 2) {
    //       retryCount++
    //       await tryDial()
    //     }
    //   }
    // }

    // await tryDial()

    // expect(onConnection).toBeCalled()
    // expect(onConnection.mock.calls[0][0].remoteAddr).toEqual(remoteAddress)
  })

  // it('rejects connection if user cert is invalid', async () => {
  //   const pems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)
  //   const anotherPems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)

  //   const prepareListenerArg = {
  //     handler: (x) => x,
  //     upgrader: {
  //       upgradeOutbound,
  //       upgradeInbound
  //     }
  //   }

  //   const signal = {
  //     addEventListener,
  //     removeEventListener
  //   }

  //   const peerId1 = 'Qme5NiSQ6V3cc3nyfYVtkkXDPGBSYEVUNCN5sM4DbyYc7s'
  //   const peerId2 = 'QmeCWxba5Yk1ZAKogQJsaHXoAermE7PgFZqpqyKNg65cSN'

  //   const agent = HttpsProxyAgent({ host: 'localhost', port: httpTunnelPort })

  //   const websocketsOverTorData1 = {
  //     upgrader: {
  //       upgradeOutbound,
  //       upgradeInbound
  //     },
  //     websocket: {
  //       agent,
  //       cert: pems.servCert,
  //       key: pems.servKey,
  //       ca: [pems.ca]
  //     },
  //     localAddress: createLibp2pAddress(service1.onionAddress, peerId1),
  //     targetPort: port1Target
  //   }

  //   const websocketsOverTorData2 = {
  //     upgrader: {
  //       upgradeOutbound,
  //       upgradeInbound
  //     },
  //     websocket: {
  //       agent,
  //       cert: anotherPems.userCert,
  //       key: anotherPems.userKey,
  //       ca: [pems.ca]
  //     },
  //     localAddress: createLibp2pAddress(service2.onionAddress, peerId2),
  //     serverOpts: {},
  //     targetPort: port2Target
  //   }
  //   const multiAddress = new Multiaddr(createLibp2pAddress(service1.onionAddress, peerId1))

  //   const ws1 = webSockets(websocketsOverTorData1)()
  //   const ws2 = webSockets(websocketsOverTorData2)()

  //   listener = await ws1.prepareListener(prepareListenerArg)

  //   await listener.listen(multiAddress)

  //   const onConnection = jest.fn()
  //   listener.on('connection', onConnection)

  //   await expect(ws2.dial(multiAddress, {
  //     signal: signal
  //   })).rejects.toBeTruthy()
  // })

  // it('rejects connection if server cert is invalid', async () => {
  //   const pems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)
  //   const anotherPems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)

  //   const prepareListenerArg = {
  //     handler: (x) => x,
  //     upgrader: {
  //       upgradeOutbound,
  //       upgradeInbound
  //     }
  //   }

  //   const signal = {
  //     addEventListener,
  //     removeEventListener
  //   }

  //   const peerId1 = 'Qme5NiSQ6V3cc3nyfYVtkkXDPGBSYEVUNCN5sM4DbyYc7s'
  //   const peerId2 = 'QmeCWxba5Yk1ZAKogQJsaHXoAermE7PgFZqpqyKNg65cSN'

  //   const agent = HttpsProxyAgent({ host: 'localhost', port: httpTunnelPort })

  //   const websocketsOverTorData1 = {
  //     upgrader: {
  //       upgradeOutbound,
  //       upgradeInbound
  //     },
  //     websocket: {
  //       agent,
  //       cert: anotherPems.servCert,
  //       key: anotherPems.servKey,
  //       ca: [pems.ca]
  //     },
  //     localAddress: createLibp2pAddress(service1.onionAddress, peerId1),
  //     targetPort: port1Target
  //   }

  //   const websocketsOverTorData2 = {
  //     upgrader: {
  //       upgradeOutbound,
  //       upgradeInbound
  //     },
  //     websocket: {
  //       agent,
  //       cert: pems.userCert,
  //       key: pems.userKey,
  //       ca: [pems.ca]
  //     },
  //     localAddress: createLibp2pAddress(service2.onionAddress, peerId2),
  //     serverOpts: {},
  //     targetPort: port2Target
  //   }
  //   const multiAddress = new Multiaddr(createLibp2pAddress(service1.onionAddress, peerId1))

  //   const ws1 = webSockets(websocketsOverTorData1)()
  //   const ws2 = webSockets(websocketsOverTorData2)()

  //   listener = await ws1.prepareListener(prepareListenerArg)

  //   await listener.listen(multiAddress)

  //   const onConnection = jest.fn()
  //   listener.on('connection', onConnection)

  //   await expect(ws2.dial(multiAddress, {
  //     signal: signal
  //   })).rejects.toBeTruthy()
  // })
})
