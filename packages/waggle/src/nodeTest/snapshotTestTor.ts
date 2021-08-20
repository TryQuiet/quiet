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
  const [socksProxy1] = await fp(1234)
  const [torControl1] = await fp(9051)

  // Node that generates snapshot
  const node1 = new NodeWithTor(
    undefined,
    undefined,
    undefined,
    port1,
    socksProxy1,
    torControl1,
    port1,
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
  const [socksProxy2] = await fp(4321)
  const [torControl2] = await fp(9052)
  const node2 = new NodeWithTor(
    undefined,
    undefined,
    undefined,
    port2,
    socksProxy2,
    torControl2,
    port2,
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
