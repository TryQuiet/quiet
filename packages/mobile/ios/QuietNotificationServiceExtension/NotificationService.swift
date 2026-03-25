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

    // Luxon's toISO() always includes milliseconds (e.g. "2024-03-21T10:00:00.000Z").
    // The default ISO8601DateFormatter does not parse fractional seconds —
    // withFractionalSeconds is required or every timestamp parse will fail.
    private static let iso8601: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private let crypto = NSECryptoService()
    private var authCache: [URL: NSEAuthService] = [:]

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        os_log("didReceive: identifier=%{public}@", log: nseLog, type: .info, request.identifier)
        os_log("didReceive: userInfo keys=%{public}@", log: nseLog, type: .info,
               request.content.userInfo.keys.map { "\($0)" }.sorted().joined(separator: ", "))

        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        fetchTask = Task {
            await fetchAndUpdate(userInfo: request.content.userInfo)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        os_log("serviceExtensionTimeWillExpire: delivering best-attempt content", log: nseLog, type: .error)
        fetchTask?.cancel()
        deliver()
    }

    // MARK: - Private

    private func fetchAndUpdate(userInfo: [AnyHashable: Any]) async {
        defer { deliver() }

        os_log("fetchAndUpdate: start", log: nseLog, type: .debug)

        guard let teamId = userInfo["teamId"] as? String else {
            os_log("fetchAndUpdate: missing 'teamId' in userInfo; payload keys=%{public}@",
                   log: nseLog, type: .error,
                   userInfo.keys.map { "\($0)" }.sorted().joined(separator: ", "))
            return
        }

        guard let qssUrlString = userInfo["qssUrl"] as? String else {
            os_log("fetchAndUpdate: missing 'qssUrl' in userInfo (teamId=%{public}@)",
                   log: nseLog, type: .error, teamId)
            return
        }

        guard let qssUrl = URL(string: qssUrlString) else {
            os_log("fetchAndUpdate: 'qssUrl' is not a valid URL: %{public}@",
                   log: nseLog, type: .error, qssUrlString)
            return
        }

        os_log("fetchAndUpdate: teamId=%{public}@ qssUrl=%{public}@",
               log: nseLog, type: .info, teamId, qssUrlString)

        do {
            let auth: NSEAuthService
            if let cached = authCache[qssUrl] {
                os_log("fetchAndUpdate: using cached NSEAuthService for %{public}@", log: nseLog, type: .debug, qssUrlString)
                auth = cached
            } else {
                os_log("fetchAndUpdate: creating new NSEAuthService for %{public}@", log: nseLog, type: .debug, qssUrlString)
                let client = NSENetworkClient(baseURL: qssUrl)
                let newAuth = NSEAuthService(client: client, crypto: crypto)
                authCache[qssUrl] = newAuth
                auth = newAuth
            }

            let since = NSEKeychainHelper.getLastSyncTimestamp()
            os_log("fetchAndUpdate: fetching entries since=%{public}lld", log: nseLog, type: .info, since)

            let entries = try await auth.fetchNewEntries(teamId: teamId, since: since)
            os_log("fetchAndUpdate: fetched %{public}d entries", log: nseLog, type: .info, entries.count)

            guard !Task.isCancelled else {
                os_log("fetchAndUpdate: task cancelled after fetch", log: nseLog, type: .info)
                return
            }

            if entries.isEmpty {
                os_log("fetchAndUpdate: no new entries, delivering as-is", log: nseLog, type: .info)
            } else {
                let newTs = entries.lazy
                    .compactMap { Self.iso8601.date(from: $0.receivedAt) }
                    .map { Int64($0.timeIntervalSince1970 * 1000) }
                    .max()
                if let newTs {
                    os_log("fetchAndUpdate: saving lastSyncTimestamp=%{public}lld", log: nseLog, type: .info, newTs)
                    NSEKeychainHelper.saveLastSyncTimestamp(newTs)
                } else {
                    // All receivedAt failed to parse — advance by 1ms to avoid reprocessing
                    os_log("All receivedAt timestamps failed to parse; advancing sync pointer", log: nseLog, type: .fault)
                    NSEKeychainHelper.saveLastSyncTimestamp(NSEKeychainHelper.getLastSyncTimestamp() + 1)
                }

                guard let content = bestAttemptContent else {
                    os_log("fetchAndUpdate: bestAttemptContent is nil, cannot update badge", log: nseLog, type: .error)
                    return
                }

                let decryptedMessages = entries.compactMap { entry -> NSEDecryptedNotificationMessage? in
                    do {
                        return try self.crypto.decryptNotificationMessage(from: entry, teamId: teamId)
                    } catch {
                        os_log(
                            "fetchAndUpdate: failed to decrypt entry %{public}@: %{public}@",
                            log: nseLog,
                            type: .error,
                            entry.cid,
                            String(describing: error)
                        )
                        return nil
                    }
                }

                if let latestMessage = decryptedMessages.last {
                    let title = content.title.trimmingCharacters(in: .whitespacesAndNewlines)
                    content.title = title.isEmpty ? "Quiet" : title
                    content.body = latestMessage.body

                    if decryptedMessages.count > 1 {
                        content.subtitle = "\(decryptedMessages.count) new messages"
                    } else {
                        content.subtitle = ""
                    }

                    os_log(
                        "fetchAndUpdate: updated notification body from decrypted message (count=%{public}d)",
                        log: nseLog,
                        type: .info,
                        decryptedMessages.count
                    )
                } else {
                    os_log("fetchAndUpdate: no decryptable channel messages found", log: nseLog, type: .info)
                }

                let badgeIncrement = decryptedMessages.isEmpty ? entries.count : decryptedMessages.count
                let newBadge = (content.badge?.intValue ?? 0) + badgeIncrement
                os_log("fetchAndUpdate: updating badge to %{public}d", log: nseLog, type: .info, newBadge)
                content.badge = newBadge as NSNumber
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
