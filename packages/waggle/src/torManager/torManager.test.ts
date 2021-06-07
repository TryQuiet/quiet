/* eslint import/first: 0 */
import { Tor } from './torManager'
import { ZBAY_DIR_PATH } from '../constants'
import { getPorts } from '../utils'
import { spawnTorProcess } from '..//testUtils'

jest.setTimeout(30_000)

test('start and close tor', async () => {
  const tor = await spawnTorProcess()
  await tor.init()
  await tor.kill()
})

test('start tor, do not kill tor process and start again', async () => {
  const torPath = `${process.cwd()}/tor/tor`
  const ports = await getPorts()
  const libPath = `${process.cwd()}/tor`
  const tor = new Tor({
    appDataPath: ZBAY_DIR_PATH,
    socksPort: ports.socksPort,
    torPath: torPath,
    controlPort: ports.controlPort,
    options: {
      env: {
        LD_LIBRARY_PATH: libPath,
        HOME: ZBAY_DIR_PATH
      },
      detached: true
    }
  })

  await tor.init()

  const torSecondInstance = new Tor({
    appDataPath: ZBAY_DIR_PATH,
    socksPort: ports.socksPort,
    torPath: torPath,
    controlPort: ports.controlPort,
    options: {
      env: {
        LD_LIBRARY_PATH: libPath,
        HOME: ZBAY_DIR_PATH
      },
      detached: true
    }
  })
  await torSecondInstance.init()
  await torSecondInstance.kill()
})

test('spawn new hidden service', async () => {
  const tor = await spawnTorProcess()
  await tor.init()
  const hiddenService = await tor.createNewHiddenService(4343, 4343)
  expect(hiddenService.onionAddress).toHaveLength(56)
  await tor.kill()
})

test('spawn hidden service using private key', async () => {
  const tor = await spawnTorProcess()
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
