//
//  KeychainError.swift
//  Quiet
//
//  Created by Isla Koenigsknecht on 2/25/26.
//

import Foundation
import CryptoKit
import Security
import CoreData
import OSLog

public enum KeychainError: Error {
  case noPassword
  case unexpectedPasswordData
  case unexpectedItemData
  case unhandledError(status: OSStatus)
}

public enum ConversionError: Error {
  case stringToBytesError
}

public enum KeychainHandlerError: Error {
  case noKeyFound
  case malformedKey
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
      let password: String = try _getKeyImpl(keyName: keyName, includeAccessGroup: true)
      return password
    } catch KeychainError.noPassword {
      do {
        let password = try _getKeyImpl(keyName: keyName, includeAccessGroup: false)
        migrateLegacyKeyIfNeeded(keyName: keyName, value: password)
        return password
      } catch KeychainError.noPassword {
        throw KeychainHandlerError.noKeyFound
      } catch KeychainError.unexpectedPasswordData {
        throw KeychainHandlerError.malformedKey
      } catch {
        throw KeychainHandlerError.unhandledError(reason: error)
      }
    } catch KeychainError.unexpectedPasswordData {
      throw KeychainHandlerError.malformedKey
    } catch ConversionError.stringToBytesError {
      throw KeychainHandlerError.malformedKey
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  public func addLfaKey(namedKey: NamedKey) throws -> KeyAddStatus {
    if let sharedKey = try? _getKeyImpl(keyName: namedKey.keyName, includeAccessGroup: true) {
      guard sharedKey == namedKey.key else {
        return KeyAddStatus.duplicateScope
      }
      return KeyAddStatus.success
    }

    if let legacyKey = try? _getKeyImpl(keyName: namedKey.keyName, includeAccessGroup: false) {
      guard legacyKey == namedKey.key else {
        return KeyAddStatus.duplicateScope
      }
    }

    do {
      let keyData: Data = try _stringToBytes(str: namedKey.key)
      let addStatus: KeyAddStatus = try _addKeyToKeychainImpl(
        keyName: namedKey.keyName,
        keyData: keyData,
        includeAccessGroup: true
      )
      if addStatus == .success {
        try? _deleteKeyImpl(keyName: namedKey.keyName, includeAccessGroup: false)
      }
      return addStatus
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  private func _getKeyImpl(keyName: String, includeAccessGroup: Bool) throws -> String  {
    var existingKey: CFTypeRef?
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keyName,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnAttributes as String: true,
      kSecReturnData as String: true
    ]
    if includeAccessGroup, let accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }
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

  private func _addKeyToKeychainImpl(keyName: String, keyData: Data, includeAccessGroup: Bool) throws -> KeyAddStatus {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: keyName,
      kSecAttrService as String: keychainService,
      kSecValueData as String: keyData,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
    ]
    if includeAccessGroup, let accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

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

  private func _deleteKeyImpl(keyName: String, includeAccessGroup: Bool) throws {
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: keychainService,
      kSecAttrAccount as String: keyName,
    ]
    if includeAccessGroup, let accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }

    let status = SecItemDelete(query as CFDictionary)
    if status != errSecSuccess && status != errSecItemNotFound {
      throw KeychainError.unhandledError(status: status)
    }
  }

  private func migrateLegacyKeyIfNeeded(keyName: String, value: String) {
    guard let data = value.data(using: .utf8) else {
      return
    }

    do {
      let addStatus = try _addKeyToKeychainImpl(keyName: keyName, keyData: data, includeAccessGroup: true)
      if addStatus == .success {
        try? _deleteKeyImpl(keyName: keyName, includeAccessGroup: false)
      }
    } catch {
      KeychainHandler.logger.error("Failed to migrate legacy key \(keyName) into shared access group: \(error.localizedDescription)")
    }
  }
}
