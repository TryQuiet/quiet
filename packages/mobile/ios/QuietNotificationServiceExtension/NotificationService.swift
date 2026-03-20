//
//  NotificationService.swift
//  QuietNotificationServiceExtension
//
//  Created by jakebot on 2026-03-10.
//

import UserNotifications

/// Notification Service Extension
/// This extension runs when a notification is received and can modify it before displaying
/// 
/// For Quiet: We use notifications as wake-up signals to tell the app to fetch new content
/// No sensitive data is sent through notifications - just metadata
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            print("Notification received in service extension")
            bestAttemptContent.title = "Quiet"
            bestAttemptContent.body = "You have new activity"
            bestAttemptContent.sound = .default
            
            print("Notification updated: \(bestAttemptContent.title)")
            
            contentHandler(bestAttemptContent)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            print("Extension time expiring - delivering notification")
            contentHandler(bestAttemptContent)
        }
    }
}
