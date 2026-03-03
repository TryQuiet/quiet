import UserNotifications
import CommonCrypto

/// Notification Service Extension for decrypting encrypted push notifications
/// This extension runs when a notification is received and processes it before displaying
class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            // Check if notification contains encrypted payload
            if let encryptedData = bestAttemptContent.userInfo["encrypted_payload"] as? String {
                print("Received encrypted notification")
                
                // Get encryption key from Keychain
                if let encryptionKey = getEncryptionKey() {
                    print("Encryption key retrieved from Keychain")
                    
                    // Decrypt the notification content
                    if let decryptedPayload = decrypt(encryptedData: encryptedData, key: encryptionKey) {
                        print("Successfully decrypted notification payload")
                        
                        // Update notification content with decrypted data
                        if let title = decryptedPayload["title"] as? String {
                            bestAttemptContent.title = title
                        }
                        
                        if let body = decryptedPayload["body"] as? String {
                            bestAttemptContent.body = body
                        }
                        
                        if let badge = decryptedPayload["badge"] as? Int {
                            bestAttemptContent.badge = NSNumber(value: badge)
                        }
                        
                        if let sound = decryptedPayload["sound"] as? String {
                            bestAttemptContent.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: sound))
                        }
                        
                        // Add decrypted data to userInfo for app to access
                        var updatedUserInfo = bestAttemptContent.userInfo
                        updatedUserInfo["decrypted_payload"] = decryptedPayload
                        updatedUserInfo.removeValue(forKey: "encrypted_payload")
                        bestAttemptContent.userInfo = updatedUserInfo
                        
                        print("Notification content updated with decrypted data")
                    } else {
                        print("Failed to decrypt notification payload")
                        showFallbackNotification()
                    }
                } else {
                    print("Encryption key not found in Keychain")
                    showFallbackNotification()
                }
            } else {
                // No encrypted payload - this is a regular notification
                print("Regular (non-encrypted) notification received")
            }
            
            contentHandler(bestAttemptContent)
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system
        // Show generic message if decryption takes too long
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            print("Extension time expiring - showing fallback notification")
            showFallbackNotification()
            contentHandler(bestAttemptContent)
        }
    }
    
    // MARK: - Private Helpers
    
    private func showFallbackNotification() {
        guard let bestAttemptContent = bestAttemptContent else { return }
        bestAttemptContent.title = "New Message"
        bestAttemptContent.body = "You have a new encrypted message"
    }
    
    private func getEncryptionKey() -> String? {
        // Retrieve encryption key from Keychain (shared between app and extension via App Group)
        guard let keyData = KeychainHelper.shared.read(service: "com.quiet.notifications", account: "encryptionKey") else {
            return nil
        }
        return String(data: keyData, encoding: .utf8)
    }
    
    private func decrypt(encryptedData: String, key: String) -> [String: Any]? {
        guard let encryptedDataBytes = Data(base64Encoded: encryptedData),
              let keyData = key.data(using: .utf8) else {
            print("Failed to decode encrypted data or key")
            return nil
        }
        
        // Ensure key is 32 bytes for AES-256
        var keyBytes = [UInt8](repeating: 0, count: kCCKeySizeAES256)
        let keyLength = min(keyData.count, kCCKeySizeAES256)
        keyData.copyBytes(to: &keyBytes, count: keyLength)
        
        // Extract IV (first 16 bytes) and encrypted content
        let ivSize = kCCBlockSizeAES128
        guard encryptedDataBytes.count > ivSize else {
            print("Encrypted data too short")
            return nil
        }
        
        let iv = encryptedDataBytes.prefix(ivSize)
        let ciphertext = encryptedDataBytes.suffix(from: ivSize)
        
        // Decrypt using AES-256-CBC
        guard let decryptedData = ciphertext.withUnsafeBytes({ (ciphertextBytes: UnsafeRawBufferPointer) -> Data? in
            guard let ciphertextBaseAddress = ciphertextBytes.baseAddress else { return nil }
            
            var decryptedBytes = [UInt8](repeating: 0, count: ciphertext.count + kCCBlockSizeAES128)
            var numBytesDecrypted: size_t = 0
            
            let cryptStatus = iv.withUnsafeBytes { (ivBytes: UnsafeRawBufferPointer) in
                CCCrypt(
                    CCOperation(kCCDecrypt),
                    CCAlgorithm(kCCAlgorithmAES),
                    CCOptions(kCCOptionPKCS7Padding),
                    keyBytes, kCCKeySizeAES256,
                    ivBytes.baseAddress,
                    ciphertextBaseAddress, ciphertext.count,
                    &decryptedBytes, decryptedBytes.count,
                    &numBytesDecrypted
                )
            }
            
            guard cryptStatus == kCCSuccess else {
                print("Decryption failed with status: \(cryptStatus)")
                return nil
            }
            
            return Data(bytes: decryptedBytes, count: numBytesDecrypted)
        }) else {
            print("Failed to decrypt data")
            return nil
        }
        
        // Parse JSON
        do {
            let json = try JSONSerialization.jsonObject(with: decryptedData, options: [])
            return json as? [String: Any]
        } catch {
            print("Failed to parse decrypted JSON: \(error)")
            return nil
        }
    }
}
