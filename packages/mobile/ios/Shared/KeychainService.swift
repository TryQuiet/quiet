import Foundation
import Security
import OSLog

// MARK: - Error type

public enum KeychainServiceError: Error {
    case itemNotFound(String)
    case unexpectedData(String)
    case missingAccessGroup
    case operationFailed(status: OSStatus)
}

// MARK: - Write result

public enum KeyAddStatus {
    case success
    case duplicateScope
}

public struct NamedKey: Codable {
    let keyName: String
    let key: String
}

public struct ChannelMetadata: Codable {
    let channelName: String
    let channelId: String
}

// MARK: - KeychainService

struct KeychainService {
    private static let lfaKeyService = "com.quietmobile"
    private static let devicePrivateKeyPrefix = "quiet.device.privateKey."
    private static let deviceIdKey = "quiet.device.id"
    private static let teamIdKey = "quiet.team.id"
    private static let channelMetadataKeyPrefix = "quiet.channelMetadata."

    private static let logger = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "com.quietmobile",
        category: "KeychainService"
    )

    private static var accessGroup: String? {
        Bundle.main.object(forInfoDictionaryKey: "QuietKeychainAccessGroup") as? String
    }

    private static func requiredAccessGroup() throws -> String {
        guard let accessGroup else {
            throw KeychainServiceError.missingAccessGroup
        }
        return accessGroup
    }

    // MARK: - Generic read

    /// Read raw data for a generic password keychain item.
    /// `service` is optional — omit it for items stored without a service attribute.
    static func readData(account: String, service: String? = nil) throws -> Data {
        // kSecAttrAccessible intentionally omitted on reads — it's a write-time attribute.
        // Including it can cause silent failures on some iOS versions.
        var query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: account,
            kSecReturnData:  true,
            kSecMatchLimit:  kSecMatchLimitOne,
        ]
        query[kSecAttrAccessGroup] = try requiredAccessGroup()
        if let service {
            query[kSecAttrService] = service
        }

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        switch status {
        case errSecSuccess:
            guard let data = result as? Data else {
                throw KeychainServiceError.unexpectedData(account)
            }
            return data
        case errSecItemNotFound:
            throw KeychainServiceError.itemNotFound(account)
        default:
            throw KeychainServiceError.operationFailed(status: status)
        }
    }

    /// Read a UTF-8 string for a generic password keychain item.
    static func readString(account: String, service: String? = nil) throws -> String {
        let data = try readData(account: account, service: service)
        guard let str = String(data: data, encoding: .utf8) else {
            throw KeychainServiceError.unexpectedData(account)
        }
        return str
    }

    // MARK: - Generic write

    /// Write data to a generic password keychain item.
    /// Returns `.success` if written, `.duplicateScope` if an item with a different value already exists.
    static func writeData(account: String, data: Data, service: String? = nil) throws -> KeyAddStatus {
        var query: [CFString: Any] = [
            kSecClass:           kSecClassGenericPassword,
            kSecAttrAccount:     account,
            kSecValueData:       data,
            kSecAttrAccessible:  kSecAttrAccessibleAfterFirstUnlock,
        ]
        query[kSecAttrAccessGroup] = try requiredAccessGroup()
        if let service {
            query[kSecAttrService] = service
        }

        let status = SecItemAdd(query as CFDictionary, nil)
        switch status {
        case errSecSuccess:
            return .success
        case errSecDuplicateItem:
            return .duplicateScope
        default:
            throw KeychainServiceError.operationFailed(status: status)
        }
    }

    // MARK: - Generic delete

    /// Delete a single generic password keychain item.
    static func delete(account: String, service: String? = nil) throws {
        var query: [CFString: Any] = [
            kSecClass:       kSecClassGenericPassword,
            kSecAttrAccount: account,
        ]
        query[kSecAttrAccessGroup] = try requiredAccessGroup()
        if let service {
            query[kSecAttrService] = service
        }

        let status = SecItemDelete(query as CFDictionary)
        logDeletion(account: account, service: service, status: status)
        if status != errSecSuccess && status != errSecItemNotFound {
            throw KeychainServiceError.operationFailed(status: status)
        }
    }

    // MARK: - List accounts

    /// List all account names for generic password items, optionally filtered by service.
    static func listAccounts(service: String? = nil) throws -> [String] {
        var query: [CFString: Any] = [
            kSecClass:            kSecClassGenericPassword,
            kSecReturnAttributes: true,
            kSecMatchLimit:       kSecMatchLimitAll,
        ]
        query[kSecAttrAccessGroup] = try requiredAccessGroup()
        if let service {
            query[kSecAttrService] = service
        }

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecItemNotFound { return [] }
        guard status == errSecSuccess else {
            throw KeychainServiceError.operationFailed(status: status)
        }

        let items: [[String: Any]]
        if let single = result as? [String: Any] {
            items = [single]
        } else if let many = result as? [[String: Any]] {
            items = many
        } else {
            return []
        }

        return items.compactMap { $0[kSecAttrAccount as String] as? String }
    }

    /// Delete all generic password items whose account starts with `prefix`.
    static func deleteAll(matchingPrefix prefix: String, service: String? = nil) throws {
        let accounts = try listAccounts(service: service)
        for account in accounts where account.hasPrefix(prefix) {
            try delete(account: account, service: service)
        }
    }

    // MARK: - Domain-specific: LFA keys

    static func getLfaKeyString(keyName: String) throws -> String {
        try readString(account: keyName, service: lfaKeyService)
    }

    static func addLfaKey(keyName: String, key: String) throws -> KeyAddStatus {
        // Check if already stored with same value
        if let existing = try? readString(account: keyName, service: lfaKeyService) {
            return existing == key ? .success : .duplicateScope
        }

        guard let keyData = key.data(using: .utf8) else {
            throw KeychainServiceError.unexpectedData(keyName)
        }
        return try writeData(account: keyName, data: keyData, service: lfaKeyService)
    }

    // MARK: - Domain-specific: Channel Metadata

    static func getChannelName(teamId: String, channelId: String) throws -> String {
        let keyName = KeychainService.generateChannelMetadataKeyName(teamId: teamId, channelId: channelId)
        return try readString(account: keyName, service: lfaKeyService)
    }

    static func addChannelMetadata(teamId: String, channelId: String, channelName: String) throws {
        let keyName = KeychainService.generateChannelMetadataKeyName(teamId: teamId, channelId: channelId)
      try upsertString(account: keyName, value: channelName, service: lfaKeyService)
    }

    static func generateChannelMetadataKeyName(teamId: String, channelId: String) -> String {
        return channelMetadataKeyPrefix + teamId + "." + channelId
    }

    // MARK: - Upsert

    /// Delete-then-add to allow updating an existing item's value.
    static func upsertString(account: String, value: String, service: String? = nil) throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainServiceError.unexpectedData(account)
        }
        try? delete(account: account, service: service)
        _ = try writeData(account: account, data: data, service: service)
    }

    // MARK: - Domain-specific: device credentials

    static func getDeviceId() throws -> String {
        try readString(account: deviceIdKey)
    }

    static func saveDeviceCredentials(deviceId: String, teamId: String, signingPrivateKey: String) throws {
        try upsertString(account: deviceIdKey, value: deviceId)
        try upsertString(account: teamIdKey, value: teamId)
        try upsertString(account: devicePrivateKeyPrefix + deviceId, value: signingPrivateKey)
    }

    static func getDevicePrivateKey(deviceId: String) throws -> Data {
        let account = devicePrivateKeyPrefix + deviceId
        let rawData = try readData(account: account)
        guard let base58String = String(data: rawData, encoding: .utf8),
              let keyBytes = Base58.decode(base58String) else {
            throw KeychainServiceError.unexpectedData("device private key is not valid Base58")
        }
        return keyBytes
    }

    // MARK: - Domain-specific: clear all Quiet data

    static func clearAllQuietData() throws {
        logger.info("clearAllQuietData: starting keychain cleanup")
        try deleteAll(matchingPrefix: "quiet_", service: lfaKeyService)
        try deleteAll(matchingPrefix: "quiet.device.privateKey.")
        try delete(account: deviceIdKey)
        try delete(account: teamIdKey)
        logger.info("clearAllQuietData: finished keychain cleanup")
    }

    // MARK: - Logging

    private static func logDeletion(account: String, service: String?, status: OSStatus) {
        let serviceLabel = service ?? "<none>"
        switch status {
        case errSecSuccess:
            logger.info("Deleted keychain item account=\(account, privacy: .public) service=\(serviceLabel, privacy: .public)")
        case errSecItemNotFound:
            logger.debug("Keychain item not found account=\(account, privacy: .public) service=\(serviceLabel, privacy: .public)")
        default:
            logger.error("Failed to delete keychain item account=\(account, privacy: .public) service=\(serviceLabel, privacy: .public) status=\(status, privacy: .public)")
        }
    }
}
