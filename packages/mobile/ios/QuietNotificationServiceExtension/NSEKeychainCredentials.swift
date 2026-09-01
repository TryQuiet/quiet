import Foundation

/// Production credential source for the notification service extension.
/// Tests inject a spy instead, which lets them prove validation completes
/// before this private-key boundary is crossed.
struct KeychainNSEDeviceCredentials: NSEDeviceCredentials {
    func deviceId() throws -> String {
        try KeychainService.getDeviceId()
    }

    func privateKey(deviceId: String) throws -> Data {
        try KeychainService.getDevicePrivateKey(deviceId: deviceId)
    }
}
