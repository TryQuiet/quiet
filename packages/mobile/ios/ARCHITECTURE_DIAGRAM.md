# Firebase Encrypted Notifications - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR BACKEND SERVER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User sends message to another user                             │
│  2. Backend encrypts notification payload:                         │
│     • Get recipient's encryption key from database                 │
│     • Generate random IV (16 bytes)                                │
│     • Encrypt payload with AES-256-CBC                             │
│     • Prepend IV to ciphertext                                     │
│     • Base64 encode result                                         │
│  3. Get recipient's FCM token from database                        │
│  4. Send via Firebase Admin SDK                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ const payload = {                                   │          │
│  │   title: "New Message",                            │          │
│  │   body: "You have a message from Alice",          │          │
│  │   badge: 1,                                         │          │
│  │   customData: { messageId: "123" }                 │          │
│  │ };                                                  │          │
│  │                                                     │          │
│  │ const encrypted = encryptPayload(                  │          │
│  │   payload,                                         │          │
│  │   userEncryptionKey                                │          │
│  │ );                                                  │          │
│  │                                                     │          │
│  │ admin.messaging().send({                           │          │
│  │   token: userFcmToken,                             │          │
│  │   data: { encrypted_payload: encrypted },         │          │
│  │   apns: {                                          │          │
│  │     payload: {                                     │          │
│  │       aps: {                                       │          │
│  │         'mutable-content': 1,  // CRITICAL!       │          │
│  │         alert: { ... },                            │          │
│  │       }                                            │          │
│  │     }                                              │          │
│  │   }                                                │          │
│  │ });                                                │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 5. Sends encrypted notification
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  FIREBASE CLOUD MESSAGING (FCM)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Receives notification from backend                              │
│  • Routes to Apple Push Notification Service (APNs)                │
│  • Handles device registration and token management                │
│  • Provides delivery guarantees and retries                        │
│  • DOES NOT decrypt - payload remains encrypted                    │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 6. Delivers via APNs
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    iOS DEVICE - APNs SYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Receives notification from Apple servers                        │
│  • Detects 'mutable-content': 1 flag                               │
│  • Launches Notification Service Extension                         │
│  • Payload still encrypted at this point                           │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 7. Launches extension
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│          NOTIFICATION SERVICE EXTENSION (Background)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  NotificationService.swift executes:                               │
│                                                                     │
│  1. didReceive() called with encrypted notification                │
│                                                                     │
│  2. Extract encrypted_payload from userInfo                        │
│                                                                     │
│  3. Retrieve encryption key from Keychain:                         │
│     ┌──────────────────────────────────────────────┐              │
│     │ KeychainHelper.shared.read(                  │              │
│     │   service: "com.quiet.notifications",        │              │
│     │   account: "encryptionKey"                   │              │
│     │ )                                            │              │
│     └──────────────────────────────────────────────┘              │
│                                                                     │
│  4. Decrypt payload:                                               │
│     • Base64 decode encrypted data                                 │
│     • Extract IV (first 16 bytes)                                  │
│     • Extract ciphertext (remaining bytes)                         │
│     • Decrypt using AES-256-CBC with key and IV                    │
│     • Parse JSON result                                            │
│                                                                     │
│  5. Update notification content:                                   │
│     • bestAttemptContent.title = decrypted.title                   │
│     • bestAttemptContent.body = decrypted.body                     │
│     • bestAttemptContent.badge = decrypted.badge                   │
│                                                                     │
│  6. Call contentHandler with updated notification                  │
│                                                                     │
│  Time limit: 30 seconds (iOS enforced)                             │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 8. Returns decrypted notification
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    iOS NOTIFICATION CENTER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Displays decrypted notification to user                         │
│  • Shows actual title: "New Message"                               │
│  • Shows actual body: "You have a message from Alice"              │
│  • Updates badge count                                             │
│  • Plays sound                                                      │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ 9. User taps notification
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MAIN APP (Foreground)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • App launches or comes to foreground                             │
│  • userNotificationCenter(_:didReceive:) called                    │
│  • Access decrypted_payload from userInfo                          │
│  • Navigate to message/channel                                     │
│  • Update UI                                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Details

### Encryption Process (Backend)

```javascript
// Input: Plain notification payload
{
  title: "New Message",
  body: "You have a message from Alice",
  badge: 1,
  customData: { messageId: "123" }
}

// Step 1: Serialize to JSON
"{"title":"New Message","body":"You have a message from Alice",...}"

// Step 2: Generate random IV
IV = [random 16 bytes]

// Step 3: Encrypt with AES-256-CBC
Ciphertext = AES256_CBC_Encrypt(JSON, key, IV)

// Step 4: Combine IV + Ciphertext
Combined = IV + Ciphertext

// Step 5: Base64 encode
Encrypted = Base64(Combined)
// Result: "kXsR2m4pQ1...encoded data..."
```

### Decryption Process (Extension)

```swift
// Input: Base64 encoded encrypted data
"kXsR2m4pQ1...encoded data..."

// Step 1: Base64 decode
Combined = Base64_Decode(encrypted)

// Step 2: Split IV and Ciphertext
IV = Combined[0...15]          // First 16 bytes
Ciphertext = Combined[16...]    // Rest

// Step 3: Get key from Keychain
Key = KeychainHelper.shared.read(...)

// Step 4: Decrypt
Plaintext = AES256_CBC_Decrypt(Ciphertext, Key, IV)

// Step 5: Parse JSON
Payload = JSONSerialization.jsonObject(Plaintext)
// Result: { title: "New Message", body: "..." }

// Step 6: Update notification
notification.title = Payload.title
notification.body = Payload.body
```

## Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                     ENCRYPTION KEY                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Generated by: Backend server                               │
│  Length: 32 characters (256 bits)                           │
│  Algorithm: AES-256-CBC                                     │
│                                                              │
│  Distribution:                                               │
│  ┌─────────────────────────────────────────────────┐       │
│  │  1. User logs in to app                         │       │
│  │  2. Backend generates/retrieves user's key      │       │
│  │  3. Backend sends key to app via secure channel│       │
│  │  4. App stores key in iOS Keychain             │       │
│  │  5. Key accessible by both app and extension    │       │
│  └─────────────────────────────────────────────────┘       │
│                                                              │
│  Storage:                                                    │
│  • Backend: Database (encrypted at rest)                    │
│  • iOS: Keychain with App Group sharing                     │
│  • Transit: HTTPS/TLS only                                  │
│                                                              │
│  Best Practices:                                             │
│  ✓ Unique key per user                                      │
│  ✓ Rotate periodically (e.g., every 30 days)               │
│  ✓ Generate with cryptographically secure RNG              │
│  ✓ Never log or expose in error messages                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌─────────────────┐
│   React Native  │
│   JavaScript    │
└────────┬────────┘
         │
         │ NativeModules.FirebaseMessagingModule
         │
         ▼
┌──────────────────────────┐
│ FirebaseMessagingModule  │◄───────┐
│      (Swift)             │        │
└────────┬─────────────────┘        │
         │                          │
         │ Messaging.messaging()    │ MessagingDelegate
         │                          │
         ▼                          │
┌────────────────────────┐          │
│   Firebase Messaging   │──────────┘
│      Framework         │
└────────┬───────────────┘
         │
         │ APNs Token
         │
         ▼
┌────────────────────────┐
│   Firebase Backend     │
│   (Cloud Messaging)    │
└────────────────────────┘


┌─────────────────────┐         ┌──────────────────────┐
│  Main App Target    │         │  Extension Target    │
│  (Quiet)            │         │  (NotificationSvc)   │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           │  Both access same key via     │
           │  App Group Keychain           │
           │                               │
           ▼                               ▼
    ┌──────────────────────────────────────────┐
    │         iOS Keychain                     │
    │   (group.com.quiet.app)                  │
    │                                          │
    │   Service: "com.quiet.notifications"     │
    │   Account: "encryptionKey"               │
    │   Value: "your-32-character-key..."      │
    └──────────────────────────────────────────┘
```

## File Relationships

```
AppDelegate.m
    ├─ Imports: AppDelegate+Firebase.swift
    ├─ Calls: configureFirebase()
    └─ Forwards: APNS token to Firebase

AppDelegate+Firebase.swift
    ├─ Implements: MessagingDelegate
    ├─ Implements: UNUserNotificationCenterDelegate
    ├─ Uses: FirebaseMessagingModule
    └─ Uses: KeychainHelper

FirebaseMessagingModule.swift
    ├─ Extends: RCTEventEmitter
    ├─ Bridges: Swift ↔ JavaScript
    └─ Uses: KeychainHelper

NotificationService.swift
    ├─ Extends: UNNotificationServiceExtension
    ├─ Uses: KeychainHelper
    └─ Decrypts: Notification payload

KeychainHelper.swift
    ├─ Shared by: Main app + Extension
    ├─ Accesses: Keychain with App Group
    └─ Manages: Encryption key storage

FirebaseMessaging.js
    ├─ Wraps: FirebaseMessagingModule
    ├─ Provides: JavaScript API
    └─ Handles: Token management
```

## Sequence Diagram: Sending Notification

```
Backend          Firebase        APNs          Extension        Main App
   │                │             │                │              │
   │  Encrypt       │             │                │              │
   │  payload       │             │                │              │
   │────────────    │             │                │              │
   │           │    │             │                │              │
   │◄───────────    │             │                │              │
   │                │             │                │              │
   │  Send via      │             │                │              │
   │  Admin SDK     │             │                │              │
   │───────────────>│             │                │              │
   │                │             │                │              │
   │                │  Forward    │                │              │
   │                │  to APNs    │                │              │
   │                │────────────>│                │              │
   │                │             │                │              │
   │                │             │  Launch        │              │
   │                │             │  extension     │              │
   │                │             │───────────────>│              │
   │                │             │                │              │
   │                │             │                │  Read key    │
   │                │             │                │  from        │
   │                │             │                │  Keychain    │
   │                │             │                │──────────    │
   │                │             │                │         │    │
   │                │             │                │◄─────────    │
   │                │             │                │              │
   │                │             │                │  Decrypt     │
   │                │             │                │──────────    │
   │                │             │                │         │    │
   │                │             │                │◄─────────    │
   │                │             │                │              │
   │                │             │  Display       │              │
   │                │             │  decrypted     │              │
   │                │             │◄───────────────│              │
   │                │             │                │              │
   │                │             │  User taps     │              │
   │                │             │  notification  │              │
   │                │             │───────────────────────────────>│
   │                │             │                │              │
   │                │             │                │              │  Handle
   │                │             │                │              │  tap
   │                │             │                │              │──────
   │                │             │                │              │     │
   │                │             │                │              │◄─────
```

---

**Diagram Version**: 1.0  
**Last Updated**: February 27, 2026  
**Purpose**: Visual reference for understanding the encrypted notification flow
