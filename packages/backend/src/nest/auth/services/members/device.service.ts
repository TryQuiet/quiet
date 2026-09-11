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

  /**
   * Generate a device for a device-invitation handshake. The existing user's ID
   * is intentionally unavailable until Local First Auth admits the device.
   */
  public static generateFirstUseDevice(deviceName = DeviceService.generateDeviceName()): FirstUseDeviceWithSecrets {
    const { userId: _untrustedUserId, ...device } = SigChain.lfa.createDevice({
      userId: '',
      deviceName,
    })
    return device
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
