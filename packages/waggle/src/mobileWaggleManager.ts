import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import { Command } from 'commander'

export const runWaggle = async (): Promise<any> => {
  const program = new Command()

  program
    .requiredOption('-a, --address <address>', 'onion address')
    .requiredOption('-p, --port <port>', 'onion port')
    .requiredOption('-s, --socks <socks>', 'socks port')
    .requiredOption('-d, --directory <directory>', 'app data path')
    .requiredOption('-t, --torControl <torControl>', 'tor control port')
    .requiredOption('-tp, --torPassword <torPassword>', 'tor password')

  program.parse(process.argv)

  const options = program.opts()

  const dataServer = new DataServer()
  await dataServer.listen()

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    agentHost: 'localhost',
    agentPort: options.socks,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: options.directory
      },
      createPaths: false,
      spawnTor: false,
      torControlPort: options.torControl,
      torPassword: options.torPassword
    }
  })

  await connectionsManager.init()
}

runWaggle().catch(error => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Run waggle err: ${error.message}`)
})
