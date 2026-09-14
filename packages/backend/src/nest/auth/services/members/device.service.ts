/**
 * Handles device-related chain operations
 */

import { createId } from '@paralleldrive/cuid2'
import { ChainServiceBase } from '../chainServiceBase'
import { Device, DeviceWithSecrets, FirstUseDeviceWithSecrets, redactDevice } from '@localfirst/auth'
import { SigChain } from '../../sigchain'
import { createLogger } from '../../../common/logger'

const logger = createLogger('auth:deviceService')
class DeviceService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  /**
   * Generate a brand new QuietDevice for a given User ID
   *
   * @param userId User ID that this device is associated with
   * @returns A newly generated QuietDevice instance
   */
  public static generateDeviceForUser(userId: string): DeviceWithSecrets {
    const params = {
      userId,
      deviceName: DeviceService.generateDeviceName(),
    }

    return SigChain.lfa.createDevice(params)
  }

  public static generateFirstUseDevice(deviceName = DeviceService.generateDeviceName()): FirstUseDeviceWithSecrets {
    return SigChain.lfa.createFirstUseDevice({ deviceName })
  }

  /**
   * Get an identifier for the current device
   *
   * @returns collision-resistant device identifier
   */
  public static generateDeviceName(): string {
    // TODO: let users set their own device name in a GUI
    return createId()
  }

  public static redactDevice(device: DeviceWithSecrets): Device {
    return redactDevice(device)
  }
}

export { DeviceService }
