import Foundation
import React
import FirebaseCore
import FirebaseMessaging

@objc(FirebaseMessagingModule)
class FirebaseMessagingModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }

    private func configuredMessaging(_ reject: RCTPromiseRejectBlock) -> Messaging? {
        guard FirebaseApp.app() != nil else {
            reject("firebase_unavailable", "Firebase is not configured", nil)
            return nil
        }
        return Messaging.messaging()
    }

    @objc
    func getToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let messaging = configuredMessaging(reject) else { return }
        messaging.token { token, error in
            if let error = error {
                reject("token_error", "Failed to get FCM token: \(error.localizedDescription)", error)
            } else if let token = token {
                resolve(token)
            } else {
                reject("token_error", "No token available", nil)
            }
        }
    }

    @objc
    func deleteToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let messaging = configuredMessaging(reject) else { return }
        messaging.deleteToken { error in
            if let error = error {
                reject("delete_error", "Failed to delete FCM token: \(error.localizedDescription)", error)
            } else {
                resolve(nil)
            }
        }
    }

    @objc
    func subscribeToTopic(_ topic: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let messaging = configuredMessaging(reject) else { return }
        messaging.subscribe(toTopic: topic) { error in
            if let error = error {
                reject("subscribe_error", "Failed to subscribe to topic \(topic): \(error.localizedDescription)", error)
            } else {
                resolve(nil)
            }
        }
    }

    @objc
    func unsubscribeFromTopic(_ topic: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let messaging = configuredMessaging(reject) else { return }
        messaging.unsubscribe(fromTopic: topic) { error in
            if let error = error {
                reject("unsubscribe_error", "Failed to unsubscribe from topic \(topic): \(error.localizedDescription)", error)
            } else {
                resolve(nil)
            }
        }
    }
}
