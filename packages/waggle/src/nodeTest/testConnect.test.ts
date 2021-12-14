import { Crypto } from '@peculiar/webcrypto'
import { createRootCA } from '@zbayapp/identity'
import getPort from 'get-port'
import waitForExpect from 'wait-for-expect'
import path from 'path'
import { RootCA } from '@zbayapp/identity/lib/generateRootCA'
import { CryptoEngine, setEngine, Time } from 'pkijs'
import logger from '../logger'
import { createTmpDir } from '../common/testUtils'
import { LocalNode, NodeWithoutTor, NodeWithTor } from './nodes'
import { sleep } from '../sleep'
const log = logger('testConnect')

const webcrypto = new Crypto()
setEngine(
  'newEngine',
  webcrypto,
  new CryptoEngine({
    name: '',
    crypto: webcrypto,
    subtle: webcrypto.subtle
  })
)

jest.setTimeout(900_000)

const tmpDir = createTmpDir()

const launchNode = async (
  i: number,
  rootCa: RootCA,
  useTor: boolean,
  bootstrapMultiaddrs: string[]
) => {
  let NodeType: typeof LocalNode
  if (useTor) {
    NodeType = NodeWithTor
  } else {
    NodeType = NodeWithoutTor
  }
  const torDir = path.join(tmpDir.name, `tor${i}`)
  const tmpAppDataPath = path.join(tmpDir.name, `.zbayTmp${i}`)
  const port = await getPort()
  const socksProxyPort = await getPort()
  const torControlPort = await getPort()
  const httpTunnelPort = await getPort()

  const node = new NodeType(
    undefined,
    undefined,
    undefined,
    port,
    socksProxyPort,
    torControlPort,
    port,
    httpTunnelPort,
    torDir,
    undefined,
    undefined,
    tmpAppDataPath,
    bootstrapMultiaddrs,
    rootCa
  )
  await node.init()
  node.storage.setName(`Node${i}`)
  log(`${node.storage.name as string} joined network`)
  return node
}

describe('Nodes connections', () => {
  test('5 nodes connect each other - using tor, providing bootstrap multiaddress of all nodes', async () => {
    const timeout = 360_000
    const noOfNodes = 2
    const expectedConnectionsAmount = noOfNodes - 1

    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))
    const rootCa = await createRootCA(
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate })
    )

    const multiaddressList = []
    const map = new Map<number, LocalNode>()

    for (let i = 0; i < noOfNodes; i++) {
      log(`initializing node ${i}`)
      const node = await launchNode(i, rootCa, true, multiaddressList)
      multiaddressList.push(node.localAddress)
      map.set(i, node)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`node ${i} waiting for ${expectedConnectionsAmount} connections`)
      const node = map.get(i)
      await waitForExpect(() => {
        expect(node.connectionsManager.libp2pInstance.connections.size).toEqual(expectedConnectionsAmount)
      }, timeout)
      log(`node ${i} received ${expectedConnectionsAmount} connections`)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`closing node ${i}`)
      const node = map.get(i)
      await node.closeServices()
    }

    await sleep(40_000)
  })

  test('5 nodes connect each other - using tor, providing only one bootstrap multiaddress', async () => {
    const timeout = 360_000
    const noOfNodes = 2
    const expectedConnectionsAmount = noOfNodes - 1

    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))
    const rootCa = await createRootCA(
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate })
    )

    const multiaddressList = []
    const map = new Map<number, LocalNode>()

    for (let i = 0; i < noOfNodes; i++) {
      log(`initializing node ${i}`)
      const node = await launchNode(i, rootCa, true, multiaddressList)
      if (i === 0) {
        multiaddressList.push(node.localAddress)
      }
      map.set(i, node)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`node ${i} waiting for ${expectedConnectionsAmount} connections`)
      const node = map.get(i)
      await waitForExpect(() => {
        expect(node.connectionsManager.libp2pInstance.connections.size).toEqual(expectedConnectionsAmount)
      }, timeout)
      log(`node ${i} received ${expectedConnectionsAmount} connections`)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`closing node ${i}`)
      const node = map.get(i)
      await node.closeServices()
    }

    await sleep(40_000)
  })

  test.only('5 nodes connect each other - no tor, providing bootstrap multiaddress of all nodes', async () => {
    const timeout = 360_000
    const noOfNodes = 5
    const expectedConnectionsAmount = noOfNodes - 1

    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))
    const rootCa = await createRootCA(
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate })
    )

    const multiaddressList = []
    const map = new Map<number, LocalNode>()

    for (let i = 0; i < noOfNodes; i++) {
      log(`initializing node ${i}`)
      const node = await launchNode(i, rootCa, false, multiaddressList)
      multiaddressList.push(node.localAddress)
      map.set(i, node)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`node ${i} waiting for ${expectedConnectionsAmount} connections`)
      const node = map.get(i)
      console.log(node.connectionsManager.libp2pInstance.connections.size, 'size')
      await waitForExpect(() => {
        expect(node.connectionsManager.libp2pInstance.connections.size).toEqual(expectedConnectionsAmount)
      }, timeout)
      log(`node ${i} received ${expectedConnectionsAmount} connections`)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`closing node ${i}`)
      const node = map.get(i)
      await node.closeServices()
    }

    await sleep(40_000)
  })

  test('5 nodes connect each other - no tor, providing only one bootstrap multiaddress', async () => {
    const timeout = 360_000
    const noOfNodes = 2
    const expectedConnectionsAmount = noOfNodes - 1

    const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
    const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))
    const rootCa = await createRootCA(
      new Time({ type: 0, value: notBeforeDate }),
      new Time({ type: 0, value: notAfterDate })
    )

    const multiaddressList = []
    const map = new Map<number, LocalNode>()

    for (let i = 0; i < noOfNodes; i++) {
      log(`initializing node ${i}`)
      const node = await launchNode(i, rootCa, false, multiaddressList)
      if (i === 0) {
        multiaddressList.push(node.localAddress)
      }
      map.set(i, node)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`node ${i} waiting for ${expectedConnectionsAmount} connections`)
      const node = map.get(i)
      console.log(node.connectionsManager.libp2pInstance.connections.size, 'size')
      await waitForExpect(() => {
        expect(node.connectionsManager.libp2pInstance.connections.size).toEqual(expectedConnectionsAmount)
      }, timeout)
      log(`node ${i} received ${expectedConnectionsAmount} connections`)
    }

    for (let i = 0; i < noOfNodes; i++) {
      log(`closing node ${i}`)
      const node = map.get(i)
      await node.closeServices()
    }

    await sleep(20_000)
  })
})
