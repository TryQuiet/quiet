import waggle from 'waggle'
import debug from 'debug'
const log = Object.assign(debug('zbay:waggle:fork'), {
  error: debug('zbay:waggle:fork:err')
})

interface IRunWaggle {
  socksPort: number
  libp2pHiddenServicePort: number
  dataServerPort: number
  appDataPath: string
  libp2pHiddenService: string
}

const runWaggle = async ({
  socksPort,
  libp2pHiddenServicePort,
  dataServerPort,
  appDataPath,
  libp2pHiddenService
}: IRunWaggle) => {
  log('starting waggle')
  const dataServer = new waggle.DataServer(dataServerPort)
  await dataServer.listen()

  const connectionsManager = new waggle.ConnectionsManager({
    port: libp2pHiddenServicePort,
    host: `${libp2pHiddenService}.onion`,
    agentHost: 'localhost',
    agentPort: socksPort,
    io: dataServer.io,
    options: {
      env: {
        appDataPath: `${appDataPath}/Zbay`
      }
    }
  })

  const killWaggle = async () => {
    try {
      await dataServer.close()
    } catch (err) {
      log.error(`Closing dataServer error ${err}`)
    }
    try {
      await connectionsManager.stopLibp2p()
    } catch (err) {
      log.error(`Closing libp2p and orbitdb error ${err}`)
    }
  }

  waggle.initListeners(dataServer.io, connectionsManager)
  process.on('message', async msg => {
    if (msg === 'connectionReady') {
      connectionsManager
        .initializeNode()
        .then(async (item) => {
          process.send(item)
          await connectionsManager.initStorage()
          process.send('waggleInitialized')
        })
        .catch(error => {
          console.log(`Couldn't initialize waggle: ${error.message}`)
        })
    } else if (msg === 'killWaggle') {
      await killWaggle()
      process.send('killedWaggle')
    }
  })

  process.send('connectToWebsocket')
}

const opts = {
  socksPort: Number(process.argv[2]),
  libp2pHiddenServicePort: Number(process.argv[3]),
  dataServerPort: Number(process.argv[4]),
  appDataPath: process.argv[5],
  libp2pHiddenService: process.argv[6]
}

void runWaggle(opts)
