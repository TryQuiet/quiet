import { createRootCA } from '@zbayapp/identity/lib'
import getPort from 'get-port'
import path from 'path'
import { Time } from 'pkijs'
import { createTmpDir } from '../common/testUtils'
import { NodeWithoutTor } from './nodes'

const tmpDir = createTmpDir()
const torDir1 = path.join(tmpDir.name, 'tor1')
const torDir2 = path.join(tmpDir.name, 'tor2')
const tmpAppDataPath1 = path.join(tmpDir.name, '.zbayTmp1')
const tmpAppDataPath2 = path.join(tmpDir.name, '.zbayTmp2')

const runTest = async () => {
  const rootCa = await createRootCA(
    new Time({ type: 0, value: new Date(Date.UTC(2010, 11, 28, 10, 10, 10)) }),
    new Time({ type: 0, value: new Date(Date.UTC(2030, 11, 28, 10, 10, 10)) })
  )
  const messagesCount = 1000
  const port1 = await getPort()
  const torControl1 = await getPort()
  const httpTunnelPort1 = await getPort()

  const node1 = new NodeWithoutTor(
    undefined,
    undefined,
    undefined,
    port1,
    undefined,
    torControl1,
    httpTunnelPort1,
    port1,
    torDir1,
    undefined,
    {
      createSnapshot: true,
      useSnapshot: true,
      messagesCount
    },
    tmpAppDataPath1,
    ['mockBootstrapAddress'],
    rootCa
  )
  await node1.init()

  const port2 = await getPort({ port: 7789 })
  const torControl2 = await getPort()
  const httpTunnelPort2 = await getPort()
  const node2 = new NodeWithoutTor(
    undefined,
    undefined,
    undefined,
    port2,
    undefined,
    torControl2,
    httpTunnelPort2,
    port2,
    torDir2,
    undefined,
    {
      createSnapshot: false,
      useSnapshot: true,
      messagesCount
    },
    tmpAppDataPath2,
    [node1.localAddress],
    rootCa
  )
  await node2.init()
}

runTest().catch((error) => {
  console.error('Something went wrong', error)
})
