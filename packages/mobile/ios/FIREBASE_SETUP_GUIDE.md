# Firebase Cloud Messaging with Encrypted Notifications - Setup Guide

This guide will walk you through setting up Firebase Cloud Messaging (FCM) with end-to-end encrypted notifications for your iOS app.

## Overview

The implementation provides:
- **Firebase Cloud Messaging** integration for reliable push notifications
- **End-to-end encryption** of notification content
- **Notification Service Extension** to decrypt notifications before display
- **React Native module** for easy JavaScript integration

## Architecture

```
Backend Server
    ↓ (sends encrypted notification)
Firebase Cloud Messaging
    ↓ (delivers to device)
Notification Service Extension
    ↓ (decrypts using shared key from Keychain)
iOS App (displays decrypted notification)
```

---

## Part 1: Xcode Project Setup

### Step 1: Add Files to Xcode Project

1. Open your `Quiet.xcworkspace` in Xcode
2. Add these new Swift files to your main app target:
   - `FirebaseMessagingModule.swift`
   - `FirebaseMessagingModule.m`
   - `KeychainHelper.swift`
   - `AppDelegate+Firebase.swift`

3. When prompted, ensure:
   - "Copy items if needed" is checked
   - Target membership includes "Quiet" (main app)

### Step 2: Create Notification Service Extension Target

1. In Xcode: **File → New → Target**
2. Select **Notification Service Extension**
3. Configuration:
   - Product Name: `QuietNotificationServiceExtension`
   - Team: (your development team)
   - Language: **Swift**
   - Bundle Identifier: `[your.bundle.id].NotificationServiceExtension`
   - (e.g., `com.example.quiet.NotificationServiceExtension`)

4. Click **Finish**
5. When prompted "Activate scheme?", click **Cancel**

### Step 3: Add Files to Extension Target

1. Delete the default `NotificationService.swift` created by Xcode
2. Add these files to the extension target:
   - Drag `NotificationService.swift` (our custom version) to the extension folder
   - Add `KeychainHelper.swift` to the extension target
     - Right-click `KeychainHelper.swift` → File Inspector
     - Check the box next to `QuietNotificationServiceExtension` under Target Membership

3. Replace the Info.plist in the extension with `QuietNotificationServiceExtension-Info.plist`

### Step 4: Configure App Groups

App Groups allow the main app and extension to share data (the encryption key).

1. In Apple Developer Portal:
   - Go to **Certificates, Identifiers & Profiles**
   - Select **Identifiers** → Your App ID
   - Enable **App Groups** capability
   - Create a new App Group: `group.com.quiet.app`
   - Do the same for the Notification Service Extension App ID

2. In Xcode - Main App Target:
   - Select **Quiet** target
   - Go to **Signing & Capabilities** tab
   - Click **+ Capability** → Add **App Groups**
   - Check `group.com.quiet.app`

3. In Xcode - Extension Target:
   - Select **QuietNotificationServiceExtension** target
   - Go to **Signing & Capabilities** tab
   - Click **+ Capability** → Add **App Groups**
   - Check `group.com.quiet.app`

---

## Part 2: CocoaPods Setup

### Step 1: Update Podfile

Add these lines to your `ios/Podfile`:

```ruby
platform :ios, '13.0'

target 'Quiet' do
  # ... your existing pods ...
  
  # Firebase Cloud Messaging
  pod 'FirebaseCore', '~> 10.20.0'
  pod 'FirebaseMessaging', '~> 10.20.0'
  pod 'FirebaseInstallations', '~> 10.20.0'
end

# Notification Service Extension target
target 'QuietNotificationServiceExtension' do
  pod 'FirebaseCore', '~> 10.20.0'
  pod 'FirebaseMessaging', '~> 10.20.0'
end
```

### Step 2: Install Pods

```bash
cd ios
pod install
```

---

## Part 3: Firebase Console Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter project name (e.g., "Quiet")
4. Choose whether to enable Google Analytics
5. Click **"Create project"**

### Step 2: Add iOS App to Firebase

1. In Firebase Console, click the **iOS icon** (⊕) to add an iOS app
2. Configuration:
   - **iOS bundle ID**: Enter your app's bundle ID
     - Find this in Xcode: Select target → General tab → Bundle Identifier
     - Example: `com.example.quiet`
   - **App nickname**: `Quiet` (optional)
   - **App Store ID**: Leave blank for now

3. Click **"Register app"**

4. **Download** `GoogleService-Info.plist`

5. Add to Xcode:
   - Drag `GoogleService-Info.plist` into your Xcode project
   - Place it in the root of your project (same level as `Info.plist`)
   - **Important**: Check target membership for **both**:
     - ✅ Quiet (main app)
     - ✅ QuietNotificationServiceExtension

### Step 3: Configure Apple Push Notification Service (APNs)

Firebase needs your APNs credentials to send notifications to iOS devices.

#### Option A: APNs Authentication Key (Recommended)

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Keys** → Click **+** to create a new key
4. Configuration:
   - Key Name: `APNs Key for Quiet`
   - Enable: **Apple Push Notifications service (APNs)**
5. Click **Continue**, then **Register**
6. **Download** the `.p8` file (you can only download once!)
7. Note your:
   - **Key ID** (e.g., `AB12CD34EF`)
   - **Team ID** (found in top-right of developer portal)

8. Upload to Firebase:
   - In Firebase Console → **Project Settings** → **Cloud Messaging** tab
   - Scroll to **APNs Authentication Key**
   - Click **Upload**
   - Upload the `.p8` file
   - Enter **Key ID** and **Team ID**

#### Option B: APNs Certificate (Legacy)

1. Open **Keychain Access** on Mac
2. Menu: **Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority**
3. Enter your email, select "Saved to disk"
4. Save the Certificate Signing Request (CSR)

5. In Apple Developer Portal:
   - Go to **Certificates, Identifiers & Profiles**
   - Select **Certificates** → Click **+**
   - Choose **Apple Push Notification service SSL (Sandbox & Production)**
   - Select your App ID
   - Upload the CSR file
   - Download the certificate

6. Double-click the certificate to add it to Keychain
7. In Keychain Access:
   - Find the certificate (usually named "Apple Push Services: ...")
   - Right-click → Export
   - Save as `.p12` file with a password

8. Upload to Firebase:
   - In Firebase Console → **Project Settings** → **Cloud Messaging** tab
   - Upload the `.p12` file
   - Enter the password

### Step 4: Get Server Key for Backend

1. In Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Find **Server key** (for legacy HTTP protocol)
3. Or download **Service Account JSON** for Firebase Admin SDK:
   - Go to **Service accounts** tab
   - Click **Generate new private key**
   - Download the JSON file
   - **Keep this file secure!** It provides admin access to your Firebase project

---

## Part 4: iOS App Integration

### Step 1: Generate and Set Encryption Key

The encryption key must be set in your app before encrypted notifications can work. This key should be:
- Exactly **32 characters** (256 bits) for AES-256
- Randomly generated
- Securely stored
- Shared between your backend and the app

```javascript
// In your React Native app initialization
import FirebaseMessaging from './FirebaseMessaging';

async function initializeNotifications() {
  try {
    // Generate or retrieve your encryption key
    // In production, this should come from your backend after authentication
    const encryptionKey = 'your-32-character-secret-key!!'; // Must be 32 chars
    
    // Store the key in Keychain (shared with notification extension)
    FirebaseMessaging.setEncryptionKey(encryptionKey);
    
    // Get FCM token
    const fcmToken = await FirebaseMessaging.getToken();
    console.log('FCM Token:', fcmToken);
    
    // Send token to your backend
    await sendTokenToBackend(fcmToken);
    
    // Optional: Subscribe to topics
    await FirebaseMessaging.subscribeToTopic('general');
    
    console.log('Firebase Messaging initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
  }
}

// Call during app startup
initializeNotifications();
```

### Step 2: Listen for Token Updates

```javascript
import FirebaseMessaging from './FirebaseMessaging';

// Listen for token received event
const unsubscribe = FirebaseMessaging.onTokenReceived((token) => {
  console.log('New FCM token:', token);
  sendTokenToBackend(token);
});

// Listen for token refresh event
const unsubscribeRefresh = FirebaseMessaging.onTokenRefreshed((token) => {
  console.log('FCM token refreshed:', token);
  sendTokenToBackend(token);
});

// Clean up listeners when component unmounts
// unsubscribe();
// unsubscribeRefresh();
```

### Step 3: Request Notification Permissions

```javascript
import { NativeModules } from 'react-native';
const { CommunicationModule } = NativeModules;

// Request notification permission (this will also trigger FCM token generation)
CommunicationModule.requestNotificationPermission();
```

---

## Part 5: Backend Integration

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Initialize Firebase Admin

```javascript
const admin = require('firebase-admin');

// Use the service account JSON you downloaded from Firebase Console
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

### Step 3: Send Encrypted Notifications

See `firebase-backend-example.js` for complete implementation. Quick example:

```javascript
const { sendEncryptedNotification } = require('./firebase-backend-example');

// Your 32-character encryption key (must match the one in the app)
const encryptionKey = 'your-32-character-secret-key!!';

// Notification payload
const payload = {
  title: 'New Message',
  body: 'You have a new message from John',
  badge: 1,
  sound: 'default',
  customData: {
    messageId: '12345',
    channelId: 'general'
  }
};

// User's FCM token (retrieved from app and stored in your database)
const userFcmToken = 'user-device-fcm-token';

// Send encrypted notification
await sendEncryptedNotification(userFcmToken, payload, encryptionKey);
```

---

## Part 6: Testing

### Step 1: Test on Physical Device

**Important**: Push notifications only work on physical iOS devices, not on simulators!

1. Build and run the app on a physical device
2. Grant notification permissions when prompted
3. Check console for FCM token
4. Copy the token

### Step 2: Test from Firebase Console

1. In Firebase Console → **Cloud Messaging** → **Send your first message**
2. Configuration:
   - **Notification title**: "Test"
   - **Notification text**: "This is a test notification"
3. Click **Send test message**
4. Paste the FCM token from your device
5. Click **Test**

This will send a **non-encrypted** test notification. You should see it on your device.

### Step 3: Test Encrypted Notifications

1. Use the backend example code to send an encrypted notification
2. The notification should appear with the decrypted content
3. Check Xcode console for extension logs:
   ```
   Received encrypted notification
   Encryption key retrieved from Keychain
   Successfully decrypted notification payload
   Notification content updated with decrypted data
   ```

---

## Part 7: Troubleshooting

### Issue: Not receiving notifications

**Check:**
1. Notification permissions are granted
2. App is properly code-signed with valid provisioning profile
3. APNs key/certificate is correctly uploaded to Firebase
4. Device has internet connection
5. FCM token is valid and sent to backend
6. Firebase server key is correct

### Issue: Receiving notifications but they're not decrypted

**Check:**
1. Encryption key is set: `FirebaseMessaging.setEncryptionKey(key)`
2. App Groups capability is enabled and configured correctly
3. KeychainHelper is added to extension target
4. Backend is using the correct encryption key (must match app)
5. Notification includes `mutable-content: 1` flag
6. Check extension logs in Xcode console

### Issue: Extension not running

**Check:**
1. Extension target is properly configured in Xcode
2. Extension Info.plist has correct NSExtensionPrincipalClass
3. Notification includes `mutable-content: 1` flag in APNS payload
4. Extension bundle ID is correct

### Issue: Keychain sharing not working

**Check:**
1. App Groups capability enabled for both targets
2. Same App Group ID used in code and capabilities
3. App Group created in Apple Developer Portal
4. Provisioning profiles regenerated after adding App Groups

---

## Security Best Practices

1. **Never hardcode encryption keys** in your app or backend
2. **Generate unique keys** per user or per session
3. **Rotate keys** periodically
4. **Use secure key exchange** protocols (e.g., Diffie-Hellman)
5. **Store backend keys securely** (use environment variables, secrets manager)
6. **Validate decrypted content** before displaying
7. **Use HTTPS** for all backend communications
8. **Monitor for suspicious activity** (unusual token patterns, etc.)

---

## API Reference

### FirebaseMessaging (JavaScript)

#### `getToken(): Promise<string>`
Get the current FCM registration token.

#### `deleteToken(): Promise<void>`
Delete the current FCM registration token.

#### `subscribeToTopic(topic: string): Promise<void>`
Subscribe to a topic for receiving topic-based notifications.

#### `unsubscribeFromTopic(topic: string): Promise<void>`
Unsubscribe from a topic.

#### `setEncryptionKey(key: string): void`
Set the encryption key for decrypting notifications. Key must be 32 characters.

#### `onTokenReceived(callback: (token: string) => void): () => void`
Listen for when a new token is received. Returns unsubscribe function.

#### `onTokenRefreshed(callback: (token: string) => void): () => void`
Listen for when the token is refreshed. Returns unsubscribe function.

---

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [App Extensions Programming Guide](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/)
- [Keychain Services](https://developer.apple.com/documentation/security/keychain_services)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Xcode console logs
3. Verify Firebase Console configuration
4. Test with non-encrypted notifications first
5. Ensure all setup steps are completed

---

**Version**: 1.0  
**Last Updated**: February 27, 2026  
**Platform**: iOS 13.0+
