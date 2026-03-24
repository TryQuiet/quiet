import Foundation
import Security

struct NSEKeychainHelper {

    // MARK: - Key names (must match what the main app stores)

    private static let devicePrivateKeyPrefix = "quiet.device.privateKey."
    private static let deviceIdKey            = "quiet.device.id"
    private static let teamIdKey              = "quiet.team.id"
    private static let lastSyncKey            = "quiet.nse.lastSyncTimestamp"

    // MARK: - Device private key

    static func getDevicePrivateKey(deviceId: String) throws -> Data {
        let account = devicePrivateKeyPrefix + deviceId
        // Stored as UTF-8 Base58 string (LFA secretKey format); decode to raw bytes
        let rawData = try readData(account: account, label: "device private key")
        guard let base58String = String(data: rawData, encoding: .utf8),
              let keyBytes = Base58.decode(base58String) else {
            throw NSEAuthError.keychainError("device private key is not valid Base58")
        }
        return keyBytes
    }

    // MARK: - Device ID

    static func getDeviceId() throws -> String {
        let data = try readData(account: deviceIdKey, label: "device ID")
        guard let str = String(data: data, encoding: .utf8) else {
            throw NSEAuthError.keychainError("device ID is not valid UTF-8")
        }
        return str
    }

    // MARK: - Team ID

    static func getTeamId() throws -> String {
        let data = try readData(account: teamIdKey, label: "team ID")
        guard let str = String(data: data, encoding: .utf8) else {
            throw NSEAuthError.keychainError("team ID is not valid UTF-8")
        }
        return str
    }

    // MARK: - Last sync timestamp (UserDefaults — not sensitive)

    static func getLastSyncTimestamp() -> Int64 {
        let defaults = UserDefaults(suiteName: "group.com.quietmobile") ?? UserDefaults.standard
        return Int64(defaults.double(forKey: lastSyncKey))
    }

    static func saveLastSyncTimestamp(_ ts: Int64) {
        let defaults = UserDefaults(suiteName: "group.com.quietmobile") ?? UserDefaults.standard
        defaults.set(Double(ts), forKey: lastSyncKey)
    }

    // MARK: - Private helpers

    // Must match the App Group entitlement in both the main app and NSE targets
    // (Signing & Capabilities → App Groups → group.com.quietmobile).
    private static let accessGroup = "group.com.quietmobile"

    private static func readData(account: String, label: String) throws -> Data {
        // Note: kSecAttrAccessible is intentionally omitted — it's a write attribute.
        // Including it in a read query can cause silent failures on some iOS versions.
        // Accessibility is enforced at write time (kSecAttrAccessibleAfterFirstUnlock).
        let query: [CFString: Any] = [
            kSecClass:           kSecClassGenericPassword,
            kSecAttrAccount:     account,
            kSecAttrAccessGroup: accessGroup,
            kSecReturnData:      true,
            kSecMatchLimit:      kSecMatchLimitOne,
        ]

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        switch status {
        case errSecSuccess:
            guard let data = result as? Data else {
                throw NSEAuthError.keychainError("Unexpected type for \(label)")
            }
            return data
        case errSecItemNotFound:
            throw NSEAuthError.missingCredentials(label)
        default:
            throw NSEAuthError.keychainError("SecItemCopyMatching failed for \(label): \(status)")
        }
    }
}
