import { ConnectionsManager } from './connectionsManager'
import { DummyIOServer, getPorts } from '../utils'
import { createTmpDir, TmpDir, tmpZbayDirPath } from '../testUtils'

let tmpDir: TmpDir
let tmpAppDataPath: string
let connectionsManager: ConnectionsManager

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
  connectionsManager = null
})

describe('Connections manager', () => {
  it('runs tor by default', async () => {
    const ports = await getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      io: new DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        torControlPort: ports.controlPort
      }
    })
    await connectionsManager.init()
    expect(connectionsManager.tor.process).not.toBeNull()
    await connectionsManager.tor.kill()
  })

  it('inits only tor control if spawnTor is set to false', async () => {
    const torPassword = 'testTorPassword'
    const ports = await getPorts()
    connectionsManager = new ConnectionsManager({
      agentHost: 'localhost',
      agentPort: ports.socksPort,
      io: new DummyIOServer(),
      options: {
        env: {
          appDataPath: tmpAppDataPath
        },
        spawnTor: false,
        torControlPort: ports.controlPort,
        torPassword
      }
    })
    await connectionsManager.init()
    expect(connectionsManager.tor.process).toBeNull()
    const torControl = connectionsManager.tor.torControl
    expect(torControl.password).toEqual(torPassword)
    expect(torControl.params.port).toEqual(ports.controlPort)
  })
})
