import Foundation
import Security

/// Helper class for storing and retrieving sensitive data in the Keychain
/// This is shared between the main app and the Notification Service Extension via App Groups
class KeychainHelper {
    static let shared = KeychainHelper()
    
    private init() {}
    
    /// Read data from Keychain
    /// - Parameters:
    ///   - service: The service identifier
    ///   - account: The account identifier
    /// - Returns: The stored data, or nil if not found
    func read(service: String, account: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecAttrAccessGroup as String: "group.com.quiet.app" // App Group for sharing
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status != errSecItemNotFound {
                print("⚠️ Keychain read error: \(status)")
            }
            return nil
        }
        
        return result as? Data
    }

    /// Save data to Keychain
    /// - Parameters:
    ///   - service: The service identifier
    ///   - account: The account identifier
    ///   - data: The data to store
    func save(service: String, account: String, data: Data) {
        // Delete existing item first
        delete(service: service, account: account)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
            kSecValueData as String: data
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        if status != errSecSuccess {
            print("⚠️ Keychain save error: \(status)")
        } else {
            print("✅ Keychain item saved successfully")
        }
    }

    /// Delete data from Keychain
    /// - Parameters:
    ///   - service: The service identifier
    ///   - account: The account identifier
    func delete(service: String, account: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]

        let status = SecItemDelete(query as CFDictionary)

        if status != errSecSuccess && status != errSecItemNotFound {
            print("⚠️ Keychain delete error: \(status)")
        }
    }
}
