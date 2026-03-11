import Foundation
import FirebaseCore
import FirebaseMessaging
import UserNotifications

extension AppDelegate: MessagingDelegate {
    
    // MARK: - Firebase Configuration
    
    @objc func configureFirebase() {
        // Configure Firebase (only once)
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        
        // Set Firebase Messaging delegate
        Messaging.messaging().delegate = self
        
        print("Firebase configured successfully")
    }
    
    // MARK: - MessagingDelegate
    
    public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")
        
        // Send FCM token to React Native
        if let token = fcmToken {
            sendFCMTokenToReactNative(token: token)
        }
    }
    
    @objc func sendFCMTokenToReactNative(token: String) {
        DispatchQueue.main.async {
            if let bridge = self.bridge {
                if let communicationModule = bridge.module(for: CommunicationModule.self) as? CommunicationModule {
                    communicationModule.sendDeviceToken(token)
                }
            }
        }
    }
    
    // MARK: - Encryption Key Management
    
    @objc func storeEncryptionKey(_ key: String) {
        guard let keyData = key.data(using: .utf8) else {
            print("Error: Invalid encryption key format")
            return
        }
        KeychainHelper.shared.save(
            service: "com.quiet.notifications",
            account: "encryptionKey",
            data: keyData
        )
        print("Encryption key stored successfully")
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    // Handle notification when app is in foreground
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                               willPresent notification: UNNotification,
                               withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        // Print notification payload for debugging
        print("Notification received in foreground: \(userInfo)")
        
        // Forward to React Native if needed
        if let bridge = self.bridge {
            if let communicationModule = bridge.module(for: CommunicationModule.self) as? CommunicationModule {
                // You can add a method to CommunicationModule to handle this
                // communicationModule.handleNotification(userInfo)
            }
        }
        
        // Show notification even when app is in foreground
        if #available(iOS 14.0, *) {
            completionHandler([[.banner, .sound, .badge]])
        } else {
            completionHandler([[.alert, .sound, .badge]])
        }
    }
    
    // Handle notification tap
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                               didReceive response: UNNotificationResponse,
                               withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        print("Notification tapped: \(userInfo)")
        
        // Forward to React Native
        if let bridge = self.bridge {
            if let communicationModule = bridge.module(for: CommunicationModule.self) as? CommunicationModule {
                // You can add a method to CommunicationModule to handle notification taps
                // communicationModule.handleNotificationTap(userInfo)
            }
        }
        
        completionHandler()
    }
}
