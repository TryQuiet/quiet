import Foundation
import CryptoKit
import Security
import OSLog

public enum KeychainError: Error {
  case noPassword
  case unexpectedPasswordData
  case unexpectedItemData
  case missingAccessGroupConfiguration
  case unhandledError(status: OSStatus)
}

public enum ConversionError: Error {
  case stringToBytesError
}

public enum KeychainHandlerError: Error {
  case noKeyFound
  case malformedKey
  case missingAccessGroupConfiguration
  case unhandledError(reason: Any)
}

public enum KeyAddStatus {
  case success
  case duplicateScope
}

public struct NamedKey: Codable {
  let keyName: String
  let key: String
}

// TODO: add string to key object conversion (e.g. string to SymmetricKey)
@objc(KeychainHandler)
class KeychainHandler: NSObject {
  private let keychainService: String = "com.quietmobile"
  private lazy var accessGroup: String? = Bundle.main.object(forInfoDictionaryKey: "QuietKeychainAccessGroup") as? String

  private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "KeychainHandler")

  public func getLfaKeyString(keyName: String) throws -> String {
    do {
      let password: String = try _getKeyImpl(keyName: keyName)
      return password
    } catch KeychainError.noPassword {
      throw KeychainHandlerError.noKeyFound
    } catch KeychainError.unexpectedPasswordData {
      throw KeychainHandlerError.malformedKey
    } catch KeychainError.missingAccessGroupConfiguration {
      throw KeychainHandlerError.missingAccessGroupConfiguration
    } catch ConversionError.stringToBytesError {
      throw KeychainHandlerError.malformedKey
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  public func addLfaKey(namedKey: NamedKey) throws -> KeyAddStatus {
    if let sharedKey = try? _getKeyImpl(keyName: namedKey.keyName) {
      guard sharedKey == namedKey.key else {
        return KeyAddStatus.duplicateScope
      }
      return KeyAddStatus.success
    }

    do {
      let keyData: Data = try _stringToBytes(str: namedKey.key)
      let addStatus: KeyAddStatus = try _addKeyToKeychainImpl(
        keyName: namedKey.keyName,
        keyData: keyData
      )
      return addStatus
    } catch KeychainError.missingAccessGroupConfiguration {
      throw KeychainHandlerError.missingAccessGroupConfiguration
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  public func clearAllQuietData() throws {
    KeychainHandler.logger.info("clearAllQuietData: starting keychain cleanup")
    try deleteLfaKeys(matchingPrefix: "quiet_")
    try deleteGenericPasswordAccounts(matchingPrefix: "quiet.device.privateKey.", service: nil)
    try deleteGenericPasswordAccount(account: "quiet.device.id", service: nil)
    try deleteGenericPasswordAccount(account: "quiet.team.id", service: nil)
    KeychainHandler.logger.info("clearAllQuietData: finished keychain cleanup")
  }

  private func requiredAccessGroup() throws -> String {
    guard let accessGroup else {
      throw KeychainError.missingAccessGroupConfiguration
    }
    return accessGroup
  }

  private func _getKeyImpl(keyName: String) throws -> String  {
    var existingKey: CFTypeRef?
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keyName,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnAttributes as String: true,
      kSecReturnData as String: true
    ]
    query[kSecAttrAccessGroup as String] = try requiredAccessGroup()
    let status: OSStatus = SecItemCopyMatching(query as CFDictionary, &existingKey)
    guard status != errSecItemNotFound else { throw KeychainError.noPassword }
    guard status == errSecSuccess else { throw KeychainError.unhandledError(status: status) }
    guard let existingItem: [String : Any] = existingKey as? [String : Any],
      let passwordData = existingItem[kSecValueData as String] as? Data,
      let password = String(data: passwordData, encoding: String.Encoding.utf8)
    else {
        throw KeychainError.unexpectedPasswordData
    }
    return password
  }

  private func _addKeyToKeychainImpl(keyName: String, keyData: Data) throws -> KeyAddStatus {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: keyName,
      kSecAttrService as String: keychainService,
      kSecValueData as String: keyData,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
    ]
    query[kSecAttrAccessGroup as String] = try requiredAccessGroup()

    let status: OSStatus = SecItemAdd(query as CFDictionary, nil)
    if status == errSecSuccess {
        return KeyAddStatus.success
    } else if status == errSecDuplicateItem {
        return KeyAddStatus.duplicateScope
    } else {
      throw KeychainError.unhandledError(status: status)
    }
  }

  private func _stringToBytes(str: String) throws -> Data  {
    let bytes: Data? = str.data(using: .utf8)
    guard bytes != nil else { throw ConversionError.stringToBytesError }
    return bytes!
  }

  private func _deleteKeyImpl(keyName: String) throws {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keyName,
    ]
    query[kSecAttrAccessGroup as String] = try requiredAccessGroup()

    let status = SecItemDelete(query as CFDictionary)
    logDeletionStatus(account: keyName, service: keychainService, status: status)
    if status != errSecSuccess && status != errSecItemNotFound {
      throw KeychainError.unhandledError(status: status)
    }
  }

  private func listGenericPasswordAccounts(service: String?) throws -> [String] {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecReturnAttributes as String: true,
      kSecMatchLimit as String: kSecMatchLimitAll,
    ]
    if let service {
      query[kSecAttrService as String] = service
    }
    query[kSecAttrAccessGroup as String] = try requiredAccessGroup()

    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    if status == errSecItemNotFound {
      return []
    }
    guard status == errSecSuccess else {
      throw KeychainError.unhandledError(status: status)
    }

    let items: [[String: Any]]
    if let item = result as? [String: Any] {
      items = [item]
    } else if let manyItems = result as? [[String: Any]] {
      items = manyItems
    } else {
      return []
    }

    return items.compactMap { $0[kSecAttrAccount as String] as? String }
  }

  private func deleteGenericPasswordAccount(account: String, service: String?) throws {
    try _deleteGenericPasswordAccount(account: account, service: service)
  }

  private func deleteGenericPasswordAccounts(matchingPrefix prefix: String, service: String?) throws {
    let accounts = try listGenericPasswordAccounts(service: service)

    for account in accounts where account.hasPrefix(prefix) {
      try deleteGenericPasswordAccount(account: account, service: service)
    }
  }

  private func deleteLfaKeys(matchingPrefix prefix: String) throws {
    let keys = try listGenericPasswordAccounts(service: keychainService)

    for keyName in keys where keyName.hasPrefix(prefix) {
      try _deleteKeyImpl(keyName: keyName)
    }
  }

  private func _deleteGenericPasswordAccount(account: String, service: String?) throws {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: account,
    ]
    if let service {
      query[kSecAttrService as String] = service
    }
    query[kSecAttrAccessGroup as String] = try requiredAccessGroup()

    let status = SecItemDelete(query as CFDictionary)
    logDeletionStatus(account: account, service: service, status: status)
    if status != errSecSuccess && status != errSecItemNotFound {
      throw KeychainError.unhandledError(status: status)
    }
  }

  private func logDeletionStatus(account: String, service: String?, status: OSStatus) {
    let serviceLabel = service ?? "<none>"
    let scopeLabel = "with-access-group"

    switch status {
    case errSecSuccess:
      KeychainHandler.logger.info(
        "Deleted keychain item account=\(account, privacy: .public) service=\(serviceLabel, privacy: .public) scope=\(scopeLabel, privacy: .public)"
      )
    case errSecItemNotFound:
      KeychainHandler.logger.debug(
        "Keychain item not found during delete account=\(account, privacy: .public) service=\(serviceLabel, privacy: .public) scope=\(scopeLabel, privacy: .public)"
      )
    default:
      KeychainHandler.logger.error(
        "Failed to delete keychain item account=\(account, privacy: .public) service=\(serviceLabel, privacy: .public) scope=\(scopeLabel, privacy: .public) status=\(status, privacy: .public)"
      )
    }
  }
}
