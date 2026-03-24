//
//  NotificationService.swift
//  QuietNotificationServiceExtension
//
//  Created by Taea Vogel on 3/12/26.
//

import UserNotifications
import os.log

private let nseLog = OSLog(subsystem: "com.quietmobile.QuietNotificationServiceExtension", category: "NotificationService")

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var fetchTask: Task<Void, Never>?

    private static let iso8601 = ISO8601DateFormatter()
    private let crypto = NSECryptoService()
    private var authCache: [URL: NSEAuthService] = [:]

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        fetchTask = Task {
            await fetchAndUpdate(userInfo: request.content.userInfo)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        fetchTask?.cancel()
        deliver()
    }

    // MARK: - Private

    private func fetchAndUpdate(userInfo: [AnyHashable: Any]) async {
        defer { deliver() }

        guard
            let teamId = userInfo["teamId"] as? String,
            let qssUrlString = userInfo["qssUrl"] as? String,
            let qssUrl = URL(string: qssUrlString)
        else {
            return
        }

        do {
            let auth: NSEAuthService
            if let cached = authCache[qssUrl] {
                auth = cached
            } else {
                let client = NSENetworkClient(baseURL: qssUrl)
                let newAuth = NSEAuthService(client: client, crypto: crypto)
                authCache[qssUrl] = newAuth
                auth = newAuth
            }

            let since = NSEKeychainHelper.getLastSyncTimestamp()
            let entries = try await auth.fetchNewEntries(teamId: teamId, since: since)

            guard !Task.isCancelled else { return }

            if !entries.isEmpty {
                let newTs = entries.lazy
                    .compactMap { Self.iso8601.date(from: $0.receivedAt) }
                    .map { Int64($0.timeIntervalSince1970 * 1000) }
                    .max()
                if let newTs {
                    NSEKeychainHelper.saveLastSyncTimestamp(newTs)
                } else {
                    // All receivedAt failed to parse — advance by 1ms to avoid reprocessing
                    os_log("All receivedAt timestamps failed to parse; advancing sync pointer", log: nseLog, type: .fault)
                    NSEKeychainHelper.saveLastSyncTimestamp(NSEKeychainHelper.getLastSyncTimestamp() + 1)
                }

                guard let content = bestAttemptContent else { return }
                content.badge = ((content.badge?.intValue ?? 0) + entries.count) as NSNumber
            }
        } catch {
            os_log("fetchAndUpdate failed: %{public}@", log: nseLog, type: .error, String(describing: error))
        }
    }

    private func deliver() {
        guard let handler = contentHandler, let content = bestAttemptContent else { return }
        // Nil contentHandler first to prevent double-delivery if serviceExtensionTimeWillExpire
        // races with task completion — both paths call deliver(), only the first wins.
        contentHandler = nil
        handler(content)
    }
}
