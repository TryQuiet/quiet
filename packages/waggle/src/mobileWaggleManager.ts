import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import { Command } from 'commander'

export const runWaggle = async (): Promise<any> => {
  const program = new Command()

  program
    .requiredOption('-d, --appDataPath <appDataPath>', 'app data path')
    .requiredOption('-s, --socksPort <socksPort>', 'socks port')
    .requiredOption('-c, --controlPort <controlPort>', 'control port')
    .requiredOption('-a, --authCookie <authCookie>', 'control port authentication cookie')

  program.parse(process.argv)

  const options = program.opts()

  const dataServer = new DataServer()
  await dataServer.listen()

  const connectionsManager: ConnectionsManager = new ConnectionsManager({
    agentHost: 'localhost',
    agentPort: options.socksPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: options.appDataPath
      },
      createPaths: false,
      spawnTor: false,
      torControlPort: options.controlPort,
      torAuthCookie: options.authCookie
    }
  })

  await connectionsManager.init()
}

runWaggle().catch(error => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`Run waggle err: ${error.message}`)
})
