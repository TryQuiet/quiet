import { Crypto } from '@peculiar/webcrypto'
import { createRootCA } from '@zbayapp/identity'
import Table from 'cli-table'
import fp from 'find-free-port'
import path from 'path'
import { CryptoEngine, setEngine, Time } from 'pkijs'
import yargs, { Argv } from 'yargs'
import logger from '../logger'
import { createTmpDir } from '../common/testUtils'
import { LocalNode, NodeWithoutTor, NodeWithTor } from './nodes'
import { RootCA } from '@zbayapp/identity/lib/generateRootCA'
const log = logger('testReplicate')

const argv = yargs.command('test', 'Test replication', (yargs: Argv) => {
  return yargs.option('useTor', {
    describe: 'Whether to use Tor or run waggle nodes on localhost',
    default: true,
    type: 'boolean'
  }).option('nodesCount', {
    describe: 'How many nodes should be run in test (does not include entry node)',
    alias: 'n',
    type: 'number'
  }).option('timeThreshold', {
    describe: 'Max time for each node complete replication (in seconds)',
    alias: 't',
    type: 'number'
  }).option('entriesCount', {
    describe: 'Number of db entries',
    alias: 'e',
    type: 'number'
  })
    .demandOption(['nodesCount', 'timeThreshold', 'entriesCount'])
    .help()
}).argv

console.log(argv)

const tmpDir = createTmpDir()
const testTimeout = (argv.nodesCount + 1) * 1000
log('Timeout for test:', testTimeout)

let NodeType: typeof LocalNode
if (argv.useTor) {
  NodeType = NodeWithTor
} else {
  NodeType = NodeWithoutTor
}

let bootstrapNode

interface NodeKeyValue {
  [key: number]: NodeData
}

class NodeData {
  checked: boolean = false
  testPassed: boolean = false
  node: any
  timeLaunched: Date
  actualReplicationTime?: number
}

const webcrypto = new Crypto()
setEngine('newEngine', webcrypto, new CryptoEngine({
  name: '',
  crypto: webcrypto,
  subtle: webcrypto.subtle
}))

const launchNode = async (i: number, rootCa: RootCA, createMessages: boolean = false, useSnapshot: boolean = false) => {
  const torDir = path.join(tmpDir.name, `tor${i}`)
  const tmpAppDataPath = path.join(tmpDir.name, `.zbayTmp${i}`)
  const [port] = await fp(7788 + i)
  const [socksProxyPort] = await fp(1234 + i)
  const [torControlPort] = await fp(9051 + i)
  const [httpTunnelPort] = await fp(8052 + i)

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
    {
      createSnapshot: createMessages,
      useSnapshot,
      messagesCount: argv.entriesCount
    },
    tmpAppDataPath,
    bootstrapNode ? [bootstrapNode.localAddress] : [],
    rootCa
  )
  await node.init()
  node.storage.setName(`Node${i}`)
  log(`${node.storage.name as string} joined network`)
  return node
}

const displayResults = (nodes: NodeKeyValue) => {
  const table = new Table({ head: ['Node name', 'Time of replication', 'Test passed'] })
  for (const nodeData of Object.values(nodes)) {
    table.push([nodeData.node.storage.name, nodeData.actualReplicationTime || '-', nodeData.testPassed])
  }
  displayTestSetup()
  console.log(table.toString())
  if (Object.values(nodes).filter(node => !node.testPassed).length > 0) {
    log.error('Test failed')
    process.exit(1)
  } else {
    log('Test passed')
    process.exit(0)
  }
}

const displayTestSetup = () => {
  const table = new Table({ head: ['Time threshold', 'Messages (db entries) count', 'Test used Tor'] })
  table.push([argv.timeThreshold, argv.entriesCount, argv.useTor])
  console.log(table.toString())
}

const runTest = async () => {
  // Run entry node with messages
  // Run second node connecting to entry node
  // Check if the second node replicated all messages within a set time range

  process.on('SIGINT', function () {
    log('Caught interrupt signal')
    log(`Removing tmp dir: ${tmpDir.name}`)
    tmpDir.removeCallback()
    process.exit(1)
  })
  const testStartTime = new Date().getTime()
  const nodesCount = Number(argv.nodesCount) // Nodes count except the entry node
  const maxReplicationTimePerNode = Number(argv.timeThreshold)
  const nodes: NodeKeyValue = {}

  const notBeforeDate = new Date(Date.UTC(2010, 11, 28, 10, 10, 10))
  const notAfterDate = new Date(Date.UTC(2030, 11, 28, 10, 10, 10))
  const rootCa = await createRootCA(new Time({ type: 0, value: notBeforeDate }), new Time({ type: 0, value: notAfterDate }))

  const initNode = async (noNumber: number) => {
    const nodeData = new NodeData()
    nodeData.checked = false
    nodeData.testPassed = false
    nodeData.node = await launchNode(noNumber, rootCa)
    nodeData.timeLaunched = new Date()
    nodes[noNumber] = nodeData
  }

  // Launch entry node
  bootstrapNode = await launchNode(0, rootCa, true, false)

  // Launch other nodes
  const numbers = [...Array(nodesCount + 1).keys()].splice(1)
  await Promise.all(numbers.map(initNode))

  // Checks
  const testIntervalId = setInterval(() => {
    const timeDiff = (new Date().getTime() - testStartTime) / 1000
    if (timeDiff > testTimeout) {
      log.error(`Timeout after ${timeDiff}`)
      // TODO: add more info (snapshots maybe?)
      clearInterval(testIntervalId)
      log(`Removing tmp dir: ${tmpDir.name}`)
      tmpDir.removeCallback()
      displayResults(nodes)
      process.exit(1)
    }
    const nodesReplicationFinished = Object.values(nodes).filter(nodeData => nodeData.node.storage.replicationTime !== undefined)
    if (nodesReplicationFinished.length === 0) return

    // Get nodes that finished replicating
    for (const nodeData of nodesReplicationFinished) {
      if (nodeData.checked === true) {
        continue
      } else {
        nodeData.actualReplicationTime = nodeData.node.storage.replicationTime
        nodeData.testPassed = nodeData.actualReplicationTime <= maxReplicationTimePerNode
        nodeData.checked = true
        log(`Test ${nodeData.testPassed ? 'passed' : 'failed'} for ${nodeData.node.storage.name as string}. Replication time: ${nodeData.actualReplicationTime as string}`)
      }
    }
    if (nodesReplicationFinished.length === nodesCount) {
      log('All nodes finished replicating')
      clearInterval(testIntervalId)
      log(`Removing tmp dir: ${tmpDir.name}`)
      tmpDir.removeCallback()
      displayResults(nodes)
    }
  }, 5_000)
}

runTest().catch((error) => {
  console.error('Something went wrong', error)
})
