import WebsocketsOverTor from './websocketOverTor'
import Multiaddr from 'multiaddr'
import { Tor } from '../torManager/index'
import os from 'os'
import fp from 'find-free-port'
import * as utils from '../common/utils'
import HttpsProxyAgent from 'https-proxy-agent'
import { createTmpDir, TmpDir, tmpZbayDirPath } from '../common/testUtils'
import { createCertificatesTestHelper } from './tests/client-server'
import { createLibp2pAddress } from '../common/utils'

jest.setTimeout(120000)

describe('websocketOverTor', () => {
  const wsType = 'wss'
  const upgradeOutbound = jest.fn()
  const upgradeInbound = jest.fn(x => x)
  const removeEventListener = jest.fn()
  const addEventListener = jest.fn()

  let tmpAppDataPath: string
  let tmpDir: TmpDir
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
  let port1: number
  let port2: number
  let listener
  let port1Target: number
  let port2Target: number

  beforeAll(async () => {
    jest.clearAllMocks()
    port1 = 443
    port2 = 443
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
    const [port1Arr] = await fp(8090)
    const [port2Arr] = await fp(port1Arr as number + 1)
    port1Target = port1Arr
    port2Target = port2Arr
    const torPath = utils.torBinForPlatform()
    const [controlPort] = await fp(9051)
    httpTunnelPort = (await fp(controlPort as number + 1)).shift()
    const socksPort = (await fp(httpTunnelPort + 1)).shift()
    tor = new Tor({
      socksPort,
      torPath,
      appDataPath: tmpAppDataPath,
      controlPort,
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

    service1 = await tor.createNewHiddenService(port1, port1Target)
    service2 = await tor.createNewHiddenService(port2, port2Target)
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
      localAddr: createLibp2pAddress(service1.onionAddress, port1, peerId1, wsType),
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
        ca: [pems.ca]
      },
      localAddr: createLibp2pAddress(service2.onionAddress, port2, peerId2, wsType),
      serverOpts: {},
      targetPort: port2Target
    }
    const multiAddress = new Multiaddr(createLibp2pAddress(service1.onionAddress, port1, peerId1, wsType))

    const remoteAddress = new Multiaddr(createLibp2pAddress(service2.onionAddress, port2, peerId2, wsType))

    const ws1 = new WebsocketsOverTor(websocketsOverTorData1)
    const ws2 = new WebsocketsOverTor(websocketsOverTorData2)

    listener = await ws1.prepareListener(prepareListenerArg)

    await listener.listen(multiAddress)

    const onConnection = jest.fn()
    listener.on('connection', onConnection)

    await ws2.dial(multiAddress, {
      signal: signal
    })

    expect(onConnection).toBeCalled()
    expect(onConnection.mock.calls[0][0].remoteAddr).toEqual(remoteAddress)
  })

  it('rejects connection if user cert is invalid', async () => {
    const pems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)
    const anotherPems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)

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
        ca: [pems.ca]
      },
      localAddr: createLibp2pAddress(service1.onionAddress, port1, peerId1, wsType),
      targetPort: port1Target
    }

    const websocketsOverTorData2 = {
      upgrader: {
        upgradeOutbound,
        upgradeInbound
      },
      websocket: {
        agent,
        cert: anotherPems.userCert,
        key: anotherPems.userKey,
        ca: [pems.ca]
      },
      localAddr: createLibp2pAddress(service2.onionAddress, port2, peerId2, wsType),
      serverOpts: {},
      targetPort: port2Target
    }
    const multiAddress = new Multiaddr(createLibp2pAddress(service1.onionAddress, port1, peerId1, wsType))

    const ws1 = new WebsocketsOverTor(websocketsOverTorData1)
    const ws2 = new WebsocketsOverTor(websocketsOverTorData2)

    listener = await ws1.prepareListener(prepareListenerArg)

    await listener.listen(multiAddress)

    const onConnection = jest.fn()
    listener.on('connection', onConnection)

    await expect(ws2.dial(multiAddress, {
      signal: signal
    })).rejects.toBeTruthy()
  })

  it('rejects connection if server cert is invalid', async () => {
    const pems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)
    const anotherPems = await createCertificatesTestHelper(`${service1.onionAddress}`, `${service2.onionAddress}`)

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
        cert: anotherPems.servCert,
        key: anotherPems.servKey,
        ca: [pems.ca]
      },
      localAddr: createLibp2pAddress(service1.onionAddress, port1, peerId1, wsType),
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
        ca: [pems.ca]
      },
      localAddr: createLibp2pAddress(service2.onionAddress, port2, peerId2, wsType),
      serverOpts: {},
      targetPort: port2Target
    }
    const multiAddress = new Multiaddr(createLibp2pAddress(service1.onionAddress, port1, peerId1, wsType))

    const ws1 = new WebsocketsOverTor(websocketsOverTorData1)
    const ws2 = new WebsocketsOverTor(websocketsOverTorData2)

    listener = await ws1.prepareListener(prepareListenerArg)

    await listener.listen(multiAddress)

    const onConnection = jest.fn()
    listener.on('connection', onConnection)

    await expect(ws2.dial(multiAddress, {
      signal: signal
    })).rejects.toBeTruthy()
  })
})
