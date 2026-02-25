//import CryptoKit
//import Security
//import CoreData

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

public struct KeyScope {
  var name: String
  var generation: Int
  var type: String
  var keyType: String
}

public enum KeyAddStatus {
  case success
  case duplicateScope
}

public struct KeyWithScope {
  var scope: KeyScope
  var key: String
}

@objc(KeychainHandler)
class KeychainHandler: NSObject {
  private let masterKeyName: String = "quiet_master_key"
  private let keychainGroupName: String = "com.quietmobile"

  public func getMasterKey() throws -> SymmetricKey {
    do {
      let password: String = try _getKeyImpl(keyName: masterKeyName)
      let passwordBytes: ContiguousBytes = try _stringToBytes(str: password)
      return SymmetricKey(data: passwordBytes)
    } catch KeychainError.noPassword {
      throw KeychainHandlerError.noKeyFound
    } catch KeychainError.unexpectedPasswordData {
      throw KeychainHandlerError.malformedKey
    } catch ConversionError.stringToBytesError {
      throw KeychainHandlerError.malformedKey
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  public func getLfaKeyString(scope: KeyScope) throws -> String {
    do {
      let keyName: String = _keyScopeToKeyName(scope: scope)
      let password: String = try _getKeyImpl(keyName: keyName)
      return password
    } catch KeychainError.noPassword {
      throw KeychainHandlerError.noKeyFound
    } catch KeychainError.unexpectedPasswordData {
      throw KeychainHandlerError.malformedKey
    } catch ConversionError.stringToBytesError {
      throw KeychainHandlerError.malformedKey
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  public func createMasterKey() throws -> SymmetricKey {
    var existingKey: SymmetricKey?
    do {
      existingKey = try getMasterKey()
    } catch KeychainHandlerError.noKeyFound {
      existingKey = nil
    } catch {
      throw error
    }

    guard existingKey == nil else { return existingKey! }
    do {
      let newKey: SymmetricKey = _generateAESKey()
      let keyData: Data = _symmetricKeyToData(key: newKey)
      let addStatus: KeyAddStatus = try _addKeyToKeychainImpl(keyName: masterKeyName, keyData: keyData)
      guard addStatus == KeyAddStatus.success else { throw KeychainHandlerError.unhandledError(reason: addStatus) }
      return newKey
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  public func addLfaKey(scope: KeyScope, key: String) throws -> KeyAddStatus {
    var existingKey: String?
    do {
      existingKey = try getLfaKeyString(scope: scope)
    } catch KeychainHandlerError.noKeyFound {
      existingKey = nil
    } catch KeychainHandlerError.malformedKey {
      existingKey = nil
    } catch {
      throw error
    }

    guard existingKey == nil else {
      guard existingKey == key else { return KeyAddStatus.duplicateScope } 
      return KeyAddStatus.success 
    }

    do {
      let keyName: String = _keyScopeToKeyName(scope: scope)
      let keyData: Data = try _stringToBytes(str: key)
      let addStatus: KeyAddStatus = try _addKeyToKeychainImpl(keyName: keyName, keyData: keyData)
      return addStatus
    } catch {
      throw KeychainHandlerError.unhandledError(reason: error)
    }
  }

  private func _getKeyImpl(keyName: String) throws -> String  {
    var existingKey: CFTypeRef?
    let query: [String: Any] = [
      kSecClass as String: kSecSharedPassword,
      kSecAttrService as String: keychainGroupName,
      kSecAttrAccount as String: keyName,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnAttributes as String: true,
      kSecReturnData as String: true
    ]
    let status: OSStatus = SecItemCopyMatching(query as CFDictionary, &existingKey)
    guard status != errSecItemNotFound else { throw KeychainError.noPassword }
    guard status == errSecSuccess else { throw KeychainError.unhandledError(status: status) }
    guard let existingItem: [String : Any] = existingKey as? [String : Any],
      let passwordData = existingItem[kSecValueData as String] as? Data,
      let password = String(data: passwordData, encoding: String.Encoding.utf8),
      let account = existingItem[kSecAttrAccount as String] as? String
    else {
        throw KeychainError.unexpectedPasswordData
    }
    return password
  }

  private func _addKeyToKeychainImpl(keyName: String, keyData: Data) throws -> KeyAddStatus {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: keyName,
      kSecAttrService as String: keychainGroupName,
      kSecValueData as String: keyData,
      kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
    ]

    let status: OSStatus = SecItemAdd(query as CFDictionary, nil)
    if status == errSecSuccess {
        return KeyAddStatus.success
    } else if status == errSecDuplicateItem {
        return KeyAddStatus.duplicateScope
    } else {
      throw KeychainError.unhandledError(status: status)
    }
  }

  private func _generateAESKey() -> SymmetricKey {
    let key: SymmetricKey = SymmetricKey(size: .bits256)
    return key
  }

  private func _stringToBytes(str: String) throws -> Data  {
    let bytes: Data? = str.data(using: .utf8)
    guard bytes != nil else { throw ConversionError.stringToBytesError }
    return bytes!
  }

  private func _symmetricKeyToData(key: SymmetricKey) -> Data {
    let keyData: Data = key.withUnsafeBytes { body in
      Data(body)
    }
    return keyData
  }

  private func _keyScopeToKeyName(scope: KeyScope) -> String {
    return "quiet_\(scope.type)_\(scope.name)_\(scope.generation)_\(scope.keyType)"
  }
}
