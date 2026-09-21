import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'
import { DeviceWithSecrets } from '3rd-party/auth/packages/auth/dist'
import { RoleName } from '..//roles/roles'
import { DeviceService } from './device.service'
import { base58 } from '@localfirst/crypto'
import { RANDOM_TEAM_NAME_LENGTH } from '../../types'
import { RANDOM_USERNAME_LENGTH } from './types'

const logger = createLogger('auth:services:device.spec')

describe('devices', () => {
  let adminSigChain: SigChain
  let newDevice: DeviceWithSecrets

  it('should initialize a new sigchain and be admin', () => {
    adminSigChain = SigChain.create()
    expect(adminSigChain).toBeDefined()
    expect(adminSigChain.context).toBeDefined()
    expect(adminSigChain.teamName).toBeDefined()
    expect(base58.detect(adminSigChain.teamName!)).toBeTruthy()
    expect(adminSigChain.teamName?.length).toBe(RANDOM_TEAM_NAME_LENGTH)
    expect(base58.detect(adminSigChain.user.userName)).toBeTruthy()
    expect(adminSigChain.user.userName.length).toBe(RANDOM_USERNAME_LENGTH)
    expect(adminSigChain.roles.amIAdmin()).toBe(true)
    expect(adminSigChain.roles.amIMemberOfRole(RoleName.MEMBER)).toBe(true)
  })
  it('sigchain should contain admin device', () => {
    adminSigChain.team!.hasDevice(adminSigChain.device.deviceId)
  })
  it('should generate a new device', () => {
    newDevice = DeviceService.generateDeviceForUser(adminSigChain.user.userId)
    expect(newDevice).toBeDefined()
  })
  it('should generate a first-use device without trusting a user ID', () => {
    const firstUseDevice = DeviceService.generateFirstUseDevice('Alice’s phone')

    expect(firstUseDevice.deviceName).toBe('Alice’s phone')
    expect(firstUseDevice.deviceId).toBeDefined()
    expect(firstUseDevice.keys.signature.secretKey).toBeDefined()
    expect(firstUseDevice).not.toHaveProperty('userId')
  })
  it('should redactDevice', () => {
    const redactedDevice = DeviceService.redactDevice(newDevice)
    expect(redactedDevice).toBeDefined()
    expect(redactedDevice.deviceId).toBe(newDevice.deviceId)
    expect(redactedDevice.deviceName).toBe(newDevice.deviceName)
  })
})
