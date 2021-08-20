import Node from './node'

const main = async () => {
  const node = new Node()
  await node.init()
}

main().catch(err => {
  console.log(`Couldn't start entryNode: ${err as string}`)
})
