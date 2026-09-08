import FirebaseCore
import FirebaseMessaging
import Foundation
import UserNotifications

extension AppDelegate: MessagingDelegate {

    // MARK: - Firebase Configuration

    @objc func configureFirebase() {
        // Configure Firebase (only once)
        if FirebaseApp.app() == nil {
            guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
                let options = FirebaseOptions(contentsOfFile: path),
                options.apiKey?.count == 39
            else {
                print("Firebase not configured: missing or invalid GoogleService-Info.plist")
                return
            }
            FirebaseApp.configure(options: options)
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
                if let communicationModule = bridge.module(for: CommunicationModule.self)
                    as? CommunicationModule
                {
                    communicationModule.sendDeviceToken(token)
                }
            }
        }
    }

    // MARK: - UNUserNotificationCenterDelegate

    // Handle notification when app is in foreground
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) ->
            Void
    ) {
        let userInfo = notification.request.content.userInfo

        // Print notification payload for debugging
        print("Notification received in foreground: \(userInfo)")

        // Forward to React Native if needed
        if let bridge = self.bridge {
            if let communicationModule = bridge.module(for: CommunicationModule.self)
                as? CommunicationModule
            {
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
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        print("Notification tapped: \(userInfo)")

        // Forward to React Native
        if let bridge = self.bridge {
            if let communicationModule = bridge.module(for: CommunicationModule.self)
                as? CommunicationModule
            {
                // You can add a method to CommunicationModule to handle notification taps
                // communicationModule.handleNotificationTap(userInfo)
            }
        }

        completionHandler()
    }
}
