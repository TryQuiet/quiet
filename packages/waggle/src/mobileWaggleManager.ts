import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import initListeners from './socket/listeners'
import { Command } from 'commander'

export const runWaggle = async (): Promise<any> => {
  const program = new Command()

  program
    .requiredOption('-a, --address <address>', 'onion address')
    .requiredOption('-p, --port <port>', 'onion port')
    .requiredOption('-s, --socks <socks>', 'socks port')
    .requiredOption('-d, --directory <directory>', 'app data path')

  program.parse(process.argv)

  const options = program.opts()

  const dataServer = new DataServer()
  await dataServer.listen()

  const connectionsManager = new ConnectionsManager({
    port: options.port,
    host: options.address,
    agentHost: 'localhost',
    agentPort: options.socks,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: options.directory
      },
      createPaths: false,
      isWaggleMobileMode: false
    }
  })

  initListeners(dataServer.io, connectionsManager)

  connectionsManager
    .initializeNode()
    .then(async () => {
      await connectionsManager.initStorage()
    })
    .catch(error => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.error(`Couldn't initialize waggle: ${error.message}`)
    })
}

runWaggle().catch(error => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Run waggle err: ${error.message}`)
})
