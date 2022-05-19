import { LocalNode, NodeWithoutTor, NodeWithTor } from './nodes'
// Entry point for local testing with docker

const main = async () => {
  let node: LocalNode
  console.log('PROCESS USE TOR?', process.env.USE_TOR)
  console.log('PROCESS BOOTSTRAP_ADDRS?', process.env.BOOTSTRAP_ADDRS)
  if (process.env.USE_TOR === 'true') {
    node = new NodeWithTor()
  } else {
    node = new NodeWithoutTor()
  }
  await node.init()
}

main().catch(err => {
  console.log(`Couldn't start node: ${err as string}`)
})
