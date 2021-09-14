import path from 'path'
import fp from 'find-free-port'
import { createTmpDir } from '../testUtils'
import { NodeWithTor } from './nodes'

const tmpDir = createTmpDir()
const torDir1 = path.join(tmpDir.name, 'tor1')
const torDir2 = path.join(tmpDir.name, 'tor2')
const tmpAppDataPath1 = path.join(tmpDir.name, '.zbayTmp1')
const tmpAppDataPath2 = path.join(tmpDir.name, '.zbayTmp2')

const runTest = async () => {
  const messagesCount = 1000
  const [port1] = await fp(7788)

  const [controlPort] = await fp(9051)
  const httpTunnelPort = (await fp(controlPort as number + 1)).shift()
  const socksPort = (await fp(httpTunnelPort as number + 1)).shift()
  // Node that generates snapshot
  const node1 = new NodeWithTor(
    undefined,
    undefined,
    undefined,
    port1,
    socksPort,
    controlPort,
    port1,
    httpTunnelPort,
    torDir1,
    undefined,
    {
      createSnapshot: true,
      useSnapshot: true,
      messagesCount
    },
    tmpAppDataPath1,
    ['mockBootstrapMultiaddress']
  )
  await node1.init()

  // Node that retrieves snapshot
  const port2 = await fp(7789)
  const [controlPort2] = await fp(9060)
  const httpTunnelPort2 = (await fp(controlPort as number + 1)).shift()
  const socksPort2 = (await fp(httpTunnelPort as number + 1)).shift()
  const node2 = new NodeWithTor(
    undefined,
    undefined,
    undefined,
    port2,
    socksPort2,
    controlPort2,
    port2,
    httpTunnelPort2,
    torDir2,
    undefined,
    {
      createSnapshot: false,
      useSnapshot: true,
      messagesCount
    },
    tmpAppDataPath2,
    [node1.localAddress]
  )
  await node2.init()
}

runTest().catch((error) => {
  console.error('Something went wrong', error)
})
