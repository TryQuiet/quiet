# Firebase Encrypted Notifications Implementation

## 📋 Overview

This implementation adds **Firebase Cloud Messaging (FCM)** with **end-to-end encrypted notifications** to your React Native iOS app. Notifications are encrypted on your backend, sent via Firebase, and decrypted on the device before being displayed to the user.

## ✨ Features

- ✅ Firebase Cloud Messaging integration for iOS
- ✅ End-to-end encryption of notification content using AES-256-CBC
- ✅ Notification Service Extension for decrypting notifications before display
- ✅ Secure key storage using iOS Keychain with App Groups
- ✅ React Native module for easy JavaScript integration
- ✅ Topic-based subscriptions for broadcast notifications
- ✅ Complete backend example for Node.js

## 📁 Files Created

### iOS Native Files
- **`FirebaseMessagingModule.swift`** - React Native bridge for Firebase Messaging
- **`FirebaseMessagingModule.m`** - Objective-C bridge file
- **`KeychainHelper.swift`** - Secure Keychain storage (shared with extension)
- **`AppDelegate+Firebase.swift`** - Firebase configuration and delegates
- **`NotificationService.swift`** - Notification Service Extension for decryption
- **`QuietNotificationServiceExtension-Info.plist`** - Extension configuration
- **`AppDelegate.m`** - Updated with Firebase initialization

### JavaScript Files
- **`FirebaseMessaging.js`** - JavaScript module for accessing Firebase features
- **`FirebaseMessagingExample.js`** - Example usage and integration patterns
- **`firebase-backend-example.js`** - Backend implementation for sending encrypted notifications

### Documentation
- **`FIREBASE_SETUP_GUIDE.md`** - Complete setup guide with step-by-step instructions
- **`FIREBASE_QUICKSTART.md`** - Quick reference for experienced developers
- **`README_FIREBASE.md`** - This file

## 🚀 Quick Start

### 1. Prerequisites
- Physical iOS device (simulator doesn't support push notifications)
- Apple Developer Account with proper certificates
- Firebase project with Cloud Messaging enabled

### 2. Installation

```bash
# Install CocoaPods dependencies
cd ios
pod install
```

### 3. Xcode Setup

1. Add all Swift and Objective-C files to your Xcode project
2. Create Notification Service Extension target: `QuietNotificationServiceExtension`
3. Configure App Groups for both main app and extension: `group.com.quiet.app`
4. Add `GoogleService-Info.plist` from Firebase Console

### 4. Firebase Setup

1. Create Firebase project
2. Add iOS app with your bundle ID
3. Upload APNs authentication key or certificate
4. Download service account JSON for backend

### 5. Code Integration

```javascript
import FirebaseMessaging from './FirebaseMessaging';

// Initialize with encryption key
FirebaseMessaging.setEncryptionKey('your-32-character-secret-key!!');

// Get FCM token
const token = await FirebaseMessaging.getToken();

// Send to your backend
sendTokenToBackend(token);
```

For detailed instructions, see **`FIREBASE_SETUP_GUIDE.md`**.

## 🏗️ Architecture

```
┌─────────────────┐
│  Backend Server │
└────────┬────────┘
         │ 1. Encrypt notification with AES-256
         │ 2. Send via Firebase Admin SDK
         ▼
┌─────────────────┐
│     Firebase    │
│  Cloud Messaging│
└────────┬────────┘
         │ 3. Deliver to device
         ▼
┌─────────────────────────┐
│  Notification Service   │
│      Extension          │
│  • Retrieves key from   │
│    Keychain             │
│  • Decrypts payload     │
│  • Updates notification │
└────────┬────────────────┘
         │ 4. Display decrypted notification
         ▼
┌─────────────────┐
│    iOS App      │
└─────────────────┘
```

## 🔐 Security

### Encryption Details
- **Algorithm**: AES-256-CBC
- **Key Size**: 256 bits (32 characters)
- **IV**: 16 bytes, randomly generated per message, prepended to ciphertext
- **Padding**: PKCS7

### Key Management
- Keys stored in iOS Keychain with `kSecAttrAccessibleAfterFirstUnlock`
- Shared between app and extension via App Groups
- Keys never transmitted in plain text
- Backend and app must have matching keys

### Best Practices
- ✅ Generate unique keys per user or session
- ✅ Rotate keys periodically
- ✅ Use secure key exchange (e.g., Diffie-Hellman, ECDH)
- ✅ Store backend keys in secure environment variables
- ❌ Never hardcode keys in source code
- ❌ Never commit keys to version control

## 📖 API Reference

### JavaScript API

#### `FirebaseMessaging.getToken(): Promise<string>`
Retrieves the current FCM registration token.

#### `FirebaseMessaging.deleteToken(): Promise<void>`
Deletes the current FCM registration token.

#### `FirebaseMessaging.setEncryptionKey(key: string): void`
Sets the encryption key for decrypting notifications. Key must be exactly 32 characters.

#### `FirebaseMessaging.subscribeToTopic(topic: string): Promise<void>`
Subscribes to a topic for broadcast notifications.

#### `FirebaseMessaging.unsubscribeFromTopic(topic: string): Promise<void>`
Unsubscribes from a topic.

#### `FirebaseMessaging.onTokenReceived(callback): () => void`
Registers a callback for when a new token is received. Returns unsubscribe function.

#### `FirebaseMessaging.onTokenRefreshed(callback): () => void`
Registers a callback for when the token is refreshed. Returns unsubscribe function.

### Backend API

See `firebase-backend-example.js` for complete implementation.

#### `sendEncryptedNotification(fcmToken, payload, encryptionKey)`
Sends an encrypted notification to a specific device.

```javascript
await sendEncryptedNotification(
  'device-fcm-token',
  {
    title: 'Message Title',
    body: 'Message body',
    badge: 1,
    sound: 'default',
    customData: { messageId: '123' }
  },
  'your-32-character-secret-key!!'
);
```

#### `sendEncryptedNotificationToTopic(topic, payload, encryptionKey)`
Sends an encrypted notification to all subscribers of a topic.

## 🧪 Testing

### Test on Device
```bash
# Build and run on physical device
react-native run-ios --device "Your Device Name"
```

### Test from Firebase Console
1. Go to Firebase Console → Cloud Messaging → Send test message
2. Use the FCM token from your device
3. Send a test notification (this will be non-encrypted)

### Test Encrypted Notifications
Use the backend example to send encrypted notifications:

```javascript
const { sendEncryptedNotification } = require('./firebase-backend-example');

await sendEncryptedNotification(
  fcmToken,
  { title: 'Test', body: 'Encrypted test message' },
  encryptionKey
);
```

### Debugging
Check Xcode console for extension logs:
```
Received encrypted notification
Encryption key retrieved from Keychain
Successfully decrypted notification payload
Notification content updated with decrypted data
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **No notifications received** | • Check APNs credentials in Firebase<br>• Verify device has internet<br>• Check FCM token is valid<br>• Test with non-encrypted notification first |
| **Notifications not decrypted** | • Verify encryption key is set<br>• Check App Groups configuration<br>• Ensure backend uses matching key<br>• Check extension logs |
| **Extension not running** | • Add `mutable-content: 1` to APNS payload<br>• Verify extension target is built<br>• Check NSExtensionPrincipalClass in Info.plist |
| **Keychain errors** | • Enable App Groups for both targets<br>• Use same group ID in code and Xcode<br>• Regenerate provisioning profiles |

## 📚 Documentation

- **Complete Setup Guide**: `FIREBASE_SETUP_GUIDE.md`
- **Quick Reference**: `FIREBASE_QUICKSTART.md`
- **Integration Examples**: `FirebaseMessagingExample.js`
- **Backend Examples**: `firebase-backend-example.js`

## 🔗 External Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service](https://developer.apple.com/documentation/usernotifications)
- [Notification Service Extensions](https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension)
- [iOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)

## 🎯 Next Steps

1. ✅ Complete Firebase Console setup
2. ✅ Add files to Xcode project
3. ✅ Create Notification Service Extension
4. ✅ Configure App Groups
5. ✅ Implement secure key exchange with backend
6. ✅ Test encrypted notifications
7. ✅ Implement notification handling in React Native
8. ✅ Add analytics and monitoring

## 📄 License

This implementation is part of the Quiet project.

## 💡 Support

For issues or questions:
1. Check troubleshooting section in `FIREBASE_SETUP_GUIDE.md`
2. Review Xcode console logs
3. Verify Firebase Console configuration
4. Test with non-encrypted notifications first

---

**Implementation Version**: 1.0  
**Last Updated**: February 27, 2026  
**Supported Platforms**: iOS 13.0+  
**Dependencies**: Firebase SDK 10.20.0+
