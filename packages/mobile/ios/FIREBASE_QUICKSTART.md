# Firebase Encrypted Notifications - Quick Start

This is a condensed setup guide for experienced developers. For detailed instructions, see `FIREBASE_SETUP_GUIDE.md`.

## Prerequisites
- Physical iOS device (push notifications don't work on simulator)
- Apple Developer Account
- Firebase account

## Setup Checklist

### 1. Xcode Configuration
- [ ] Add all Swift files to Xcode project
- [ ] Create Notification Service Extension target named `QuietNotificationServiceExtension`
- [ ] Add `KeychainHelper.swift` to both main app and extension targets
- [ ] Configure App Groups: `group.com.quiet.app` for both targets

### 2. CocoaPods
```bash
cd ios
# Add Firebase pods to Podfile (see FIREBASE_SETUP_GUIDE.md)
pod install
```

### 3. Firebase Console
- [ ] Create Firebase project
- [ ] Add iOS app with your bundle ID
- [ ] Download `GoogleService-Info.plist` and add to Xcode (both targets)
- [ ] Upload APNs key/certificate to Firebase
- [ ] Download service account JSON for backend

### 4. Code Integration

**Initialize in React Native:**
```javascript
import FirebaseMessaging from './FirebaseMessaging';

// Set encryption key (32 characters)
FirebaseMessaging.setEncryptionKey('your-32-character-secret-key!!');

// Get FCM token
const token = await FirebaseMessaging.getToken();

// Send token to backend for later use
sendTokenToBackend(token);
```

**Send from Backend:**
```javascript
const { sendEncryptedNotification } = require('./firebase-backend-example');

await sendEncryptedNotification(
  fcmToken,
  { 
    title: 'Title', 
    body: 'Message',
    badge: 1 
  },
  'your-32-character-secret-key!!'
);
```

## File Structure

```
ios/
├── AppDelegate.h
├── AppDelegate.m (modified)
├── AppDelegate+Firebase.swift (new)
├── FirebaseMessagingModule.swift (new)
├── FirebaseMessagingModule.m (new)
├── KeychainHelper.swift (new)
├── NotificationService.swift (new)
├── QuietNotificationServiceExtension-Info.plist (new)
└── GoogleService-Info.plist (download from Firebase)

Root/
├── FirebaseMessaging.js (new)
├── firebase-backend-example.js (new)
├── FIREBASE_SETUP_GUIDE.md (new)
└── FIREBASE_QUICKSTART.md (this file)
```

## Testing

1. Run on physical device
2. Grant notification permissions
3. Check console for FCM token
4. Send test notification from backend
5. Verify notification appears with decrypted content

## Common Issues

| Issue | Solution |
|-------|----------|
| No notifications received | Check APNs credentials in Firebase Console |
| Notifications not decrypted | Verify encryption key is set and matches backend |
| Extension not running | Add `mutable-content: 1` to APNS payload |
| Keychain access denied | Configure App Groups correctly |

## Important Security Notes

⚠️ **Never hardcode encryption keys in production!**
- Generate keys per-user or per-session
- Store backend keys in environment variables
- Use secure key exchange protocols
- Rotate keys periodically

## API Quick Reference

```javascript
// Get token
const token = await FirebaseMessaging.getToken();

// Set encryption key
FirebaseMessaging.setEncryptionKey(key);

// Subscribe to topic
await FirebaseMessaging.subscribeToTopic('updates');

// Listen for token updates
FirebaseMessaging.onTokenReceived((token) => {
  console.log('Token:', token);
});
```

## Next Steps

1. Implement secure key exchange with your backend
2. Store FCM tokens in your database
3. Add notification handling in React Native
4. Implement badge management
5. Add support for notification actions
6. Set up analytics and monitoring

For complete documentation, see `FIREBASE_SETUP_GUIDE.md`.
