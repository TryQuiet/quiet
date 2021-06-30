/* eslint import/first: 0 */
import { Tor } from './torManager'
import { getPorts, torBinForPlatform, torDirForPlatform } from '../utils'
import { createTmpDir, spawnTorProcess, TmpDir, tmpZbayDirPath } from '../testUtils'

jest.setTimeout(100_000)

let tmpDir: TmpDir
let tmpAppDataPath: string

beforeEach(() => {
  jest.clearAllMocks()
  tmpDir = createTmpDir()
  tmpAppDataPath = tmpZbayDirPath(tmpDir.name)
})

afterEach(async () => {
  tmpDir.removeCallback()
})

describe('Tor manager', () => {
  it('starts and closes tor', async () => {
    const tor = await spawnTorProcess(tmpAppDataPath)
    await tor.init()
    await tor.kill()
  })

  it('should detect and kill old tor process before new tor is spawned', async () => {
    // This does not pass on windows (EBUSY: resource busy or locked, unlink '(...)\.zbay\TorDataDirectory\lock')
    // Probably only test config issue
    const torPath = torBinForPlatform()
    const ports = await getPorts()
    const libPath = torDirForPlatform()
    const tor = new Tor({
      appDataPath: tmpAppDataPath,
      socksPort: ports.socksPort,
      torPath: torPath,
      controlPort: ports.controlPort,
      options: {
        env: {
          LD_LIBRARY_PATH: libPath,
          HOME: tmpAppDataPath
        },
        detached: true
      }
    })

    await tor.init()

    const torSecondInstance = new Tor({
      appDataPath: tmpAppDataPath,
      socksPort: ports.socksPort,
      torPath: torPath,
      controlPort: ports.controlPort,
      options: {
        env: {
          LD_LIBRARY_PATH: libPath,
          HOME: tmpAppDataPath
        },
        detached: true
      }
    })
    await torSecondInstance.init()
    await torSecondInstance.kill()
  })

  it('spawns new hidden service', async () => {
    const tor = await spawnTorProcess(tmpAppDataPath)
    await tor.init()
    const hiddenService = await tor.createNewHiddenService(4343, 4343)
    expect(hiddenService.onionAddress).toHaveLength(56)
    await tor.kill()
  })

  it('spawns hidden service using private key', async () => {
    const tor = await spawnTorProcess(tmpAppDataPath)
    await tor.init()
    const hiddenServiceOnionAddress = await tor.spawnHiddenService({
      virtPort: 4343,
      targetPort: 4343,
      privKey:
        'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ=='
    })
    expect(hiddenServiceOnionAddress).toBe('u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad')
    await tor.kill()
  })

  it('generates hashed password', async () => {
    const tor = await spawnTorProcess(tmpAppDataPath)
    tor.generateHashedPassword()
    console.log(tor.torHashedPassword)
    console.log(tor.torPassword)
    expect(tor.torHashedPassword).toHaveLength(61)
    expect(tor.torPassword).toHaveLength(32)
  })
})
