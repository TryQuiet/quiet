import { Test, TestingModule } from '@nestjs/testing'
import { defaultConfigForTest, TestModule } from '../common/test.module'
import { createTmpDir, tmpQuietDirPath } from '../common/utils'
import { removeFilesFromDir, torBinForPlatform, torDirForPlatform } from '../common/utils'
import { QUIET_DIR, TOR_CONTROL_PARAMS, TOR_PARAMS_PROVIDER, TOR_PASSWORD_PROVIDER } from '../const'
import { TorModule } from './tor.module'
import { Tor } from './tor.service'
import { type DirResult } from 'tmp'
import { jest } from '@jest/globals'
import { TorControlAuthType } from './tor.types'
import { TorControl } from './tor-control.service'
import crypto from 'crypto'
jest.setTimeout(100_000)
describe('TorControl', () => {
  let module: TestingModule
  let torService: Tor
  let torControl: TorControl
  let tmpDir: DirResult
  let tmpAppDataPath: string
  // let quietDir: string

  const torPassword = crypto.randomBytes(16).toString('hex')

  beforeEach(async () => {
    jest.clearAllMocks()
    tmpDir = createTmpDir()
    tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    module = await Test.createTestingModule({
      imports: [TestModule, TorModule],
    })
      .overrideProvider(TOR_PASSWORD_PROVIDER)
      .useValue({ torPassword: torPassword, torHashedPassword: '' })
      .overrideProvider(TOR_PARAMS_PROVIDER)
      .useValue({
        torPath: torBinForPlatform(),
        options: {
          env: {
            LD_LIBRARY_PATH: torDirForPlatform(),
            HOME: tmpAppDataPath,
          },
          detached: true,
        },
      })
      .overrideProvider(TOR_CONTROL_PARAMS)
      .useValue({
        port: defaultConfigForTest.torControlPort,
        host: 'localhost',
        auth: {
          value: torPassword,
          type: TorControlAuthType.PASSWORD,
        },
      })
      .overrideProvider(QUIET_DIR)
      .useValue(tmpAppDataPath)
      .compile()
    // quietDir = await module.resolve(QUIET_DIR)
    torService = await module.resolve(Tor)
    torControl = await module.resolve(TorControl)
    torControl.authString = 'AUTHENTICATE ' + torPassword + '\r\n'
  })

  afterEach(async () => {
    tmpDir.removeCallback()
    removeFilesFromDir(tmpAppDataPath)
    torService.clearHangingTorProcess()
    await torService.kill()
    await module.close()
  })

  it('Init tor', async () => {
    expect(torService).toBeDefined()
    await torService.init()
  })

  // it('should detect and kill old tor process before new tor is spawned', async () => {
  //   const torPath = torBinForPlatform()
  //   const httpTunnelPort = await getPort()
  //   const libPath = torDirForPlatform()
  //   const tor = new Tor({
  //     appDataPath: tmpAppDataPath,
  //     torPath,
  //     httpTunnelPort,
  //     options: {
  //       env: {
  //         LD_LIBRARY_PATH: libPath,
  //         HOME: tmpAppDataPath,
  //       },
  //       detached: true,
  //     },
  //   })

  //   await tor.init()

  //   const torSecondInstance = new Tor({
  //     appDataPath: tmpAppDataPath,
  //     torPath,
  //     httpTunnelPort,
  //     options: {
  //       env: {
  //         LD_LIBRARY_PATH: libPath,
  //         HOME: tmpAppDataPath,
  //       },
  //       detached: true,
  //     },
  //   })
  //   await torSecondInstance.init({})
  //   await torSecondInstance.kill()
  // })

  it('spawns new hidden service', async () => {
    await torService.init()
    const hiddenService = await torService.createNewHiddenService({ targetPort: 4343 })
    expect(hiddenService.onionAddress.split('.')[0]).toHaveLength(56)
  })

  it('spawns hidden service using private key', async () => {
    await torService.init()
    const hiddenServiceOnionAddress = await torService.spawnHiddenService({
      targetPort: 4343,
      privKey: 'ED25519-V3:uCr5t3EcOCwig4cu7pWY6996whV+evrRlI0iIIsjV3uCz4rx46sB3CPq8lXEWhjGl2jlyreomORirKcz9mmcdQ==',
    })
    expect(hiddenServiceOnionAddress).toBe('u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad.onion')
    await torService.kill()
  })

  // currently provider generate password
  // it('generates hashed password', async () => {
  //   await torService.init()
  //   torService.generateHashedPassword()
  //   console.log(torService.torHashedPassword)
  //   console.log(torService.torPassword)
  //   expect(tor.torHashedPassword).toHaveLength(61)
  //   expect(tor.torPassword).toHaveLength(32)
  // })

  it('tor spawn repeating 3 times with 1 second timeout and repeating will stop after that', async () => {
    // const torPath = torBinForPlatform()
    // const httpTunnelPort = await getPort()
    // const libPath = torDirForPlatform()
    // const tor = new Tor({
    //   appDataPath: tmpAppDataPath,
    //   torPath,
    //   httpTunnelPort,
    //   options: {
    //     env: {
    //       LD_LIBRARY_PATH: libPath,
    //       HOME: tmpAppDataPath,
    //     },
    //     detached: true,
    //   },
    // })

    await expect(torService.init({ repeat: 3, timeout: 1000 })).rejects.toThrow('Failed to spawn tor 4 times')

    await torService.kill()
  })

  it('tor is initializing correctly with 40 seconds timeout', async () => {
    // const torPath = torBinForPlatform()
    // const httpTunnelPort = await getPort()
    // const libPath = torDirForPlatform()
    // const tor = new Tor({
    //   appDataPath: tmpAppDataPath,
    //   torPath,
    //   httpTunnelPort,
    //   options: {
    //     env: {
    //       LD_LIBRARY_PATH: libPath,
    //       HOME: tmpAppDataPath,
    //     },
    //     detached: true,
    //   },
    // })

    await torService.init({ repeat: 3, timeout: 40000 })
    await torService.kill()
  })

  it('creates and destroys hidden service', async () => {
    await torService.init()
    const hiddenService = await torService.createNewHiddenService({ targetPort: 4343 })
    const serviceId = hiddenService.onionAddress.split('.')[0]
    const status = await torService.destroyHiddenService(serviceId)
    expect(status).toBe(true)
    await torService.kill()
  })

  it('attempt destroy nonexistent hidden service', async () => {
    // const tor = await spawnTorProcess(tmpAppDataPath)
    await torService.init()

    const status = await torService.destroyHiddenService('u2rg2direy34dj77375h2fbhsc2tvxj752h4tlso64mjnlevcv54oaad')
    expect(status).toBe(false)
    await torService.kill()
  })

  it('should find hanging tor process and kill it', async () => {
    const processKill = jest.spyOn(process, 'kill')
    await torService.init()
    torService.clearHangingTorProcess()
    expect(processKill).toHaveBeenCalledTimes(1)
  })

  it('should find hanging tor process and kill it if Quiet path includes space', async () => {
    tmpDir = createTmpDir('quietTest Tmp_') // On MacOS quiet data lands in '(...)/Application Support/(...)' which caused problems with grep
    tmpAppDataPath = tmpQuietDirPath(tmpDir.name)
    const processKill = jest.spyOn(process, 'kill')
    await torService.init()
    torService.clearHangingTorProcess()
    expect(processKill).toHaveBeenCalledTimes(1)
  })
})
