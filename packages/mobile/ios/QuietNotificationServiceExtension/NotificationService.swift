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
    private static let appGroupIdentifier = "group.com.quietmobile"
    private static let badgeCountKey = "quiet.nse.badgeCount"

    private struct TimedEntry {
        let entry: LogEntry
        let timestamp: Int64?
    }

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

        os_log("fetchAndUpdate: start", log: nseLog, type: .info)

        if NSEKeychainHelper.isMainAppForeground() {
            os_log("fetchAndUpdate: app is foregrounded, skipping NSE fetch/decrypt work", log: nseLog, type: .info)
            return
        }

        guard let teamId = userInfo["teamId"] as? String else {
            os_log("fetchAndUpdate: missing 'teamId' in userInfo; payload keys=%{public}@",
                   log: nseLog, type: .error,
                   userInfo.keys.map { "\($0)" }.sorted().joined(separator: ", "))
            return
        }

        guard let qssUrl = NSEKeychainHelper.getQssUrl(teamId: teamId) else {
            os_log("fetchAndUpdate: missing stored QSS URL for teamId=%{public}@",
                   log: nseLog, type: .error, teamId)
            return
        }

        let qssUrlString = qssUrl.absoluteString
        if let payloadQssUrl = userInfo["qssUrl"] as? String, payloadQssUrl != qssUrlString {
            os_log("fetchAndUpdate: ignoring push payload qssUrl for teamId=%{public}@; using stored value",
                   log: nseLog, type: .info, teamId)
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
            let lastSyncCids = Set(NSEKeychainHelper.getLastSyncCids())
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
                let timedEntries = entries.map { entry in
                    let parsedDate = Self.iso8601.date(from: entry.receivedAt)
                    let timestamp = parsedDate.map { Int64($0.timeIntervalSince1970 * 1000) }
                    return TimedEntry(entry: entry, timestamp: timestamp)
                }

                let unseenEntries = timedEntries.filter { timedEntry in
                    guard let timestamp = timedEntry.timestamp else {
                        return true
                    }
                    if timestamp > since {
                        return true
                    }
                    if timestamp < since {
                        return false
                    }
                    return !lastSyncCids.contains(timedEntry.entry.cid)
                }

                if unseenEntries.isEmpty {
                    os_log("fetchAndUpdate: no unseen entries after cursor filtering", log: nseLog, type: .info)
                    return
                }

                let sortedEntries = unseenEntries.sorted { lhs, rhs in
                    let leftTs = lhs.timestamp ?? Int64.min
                    let rightTs = rhs.timestamp ?? Int64.min
                    if leftTs != rightTs {
                        return leftTs < rightTs
                    }
                    return lhs.entry.cid < rhs.entry.cid
                }

                let isBootstrapSync = since == 0
                let notificationEntries: [TimedEntry]
                if isBootstrapSync, let newestTimestamp = sortedEntries.compactMap(\.timestamp).max() {
                    notificationEntries = sortedEntries.filter { $0.timestamp == newestTimestamp }
                    os_log(
                        "fetchAndUpdate: bootstrap sync detected, collapsing %{public}d fetched entries to %{public}d newest entries",
                        log: nseLog,
                        type: .info,
                        sortedEntries.count,
                        notificationEntries.count
                    )
                } else {
                    notificationEntries = sortedEntries
                }

                let maxTimestamp = sortedEntries.compactMap(\.timestamp).max()
                if let maxTimestamp {
                    let cidsAtMaxTimestamp = sortedEntries
                        .filter { $0.timestamp == maxTimestamp }
                        .map(\.entry.cid)
                    os_log(
                        "fetchAndUpdate: saving sync state timestamp=%{public}lld with %{public}d cid(s)",
                        log: nseLog,
                        type: .info,
                        maxTimestamp,
                        cidsAtMaxTimestamp.count
                    )
                    NSEKeychainHelper.saveLastSyncState(timestamp: maxTimestamp, cids: cidsAtMaxTimestamp)
                } else {
                    // All receivedAt failed to parse — advance by 1ms to avoid reprocessing
                    os_log("All receivedAt timestamps failed to parse; advancing sync pointer", log: nseLog, type: .fault)
                    NSEKeychainHelper.saveLastSyncState(
                        timestamp: NSEKeychainHelper.getLastSyncTimestamp() + 1,
                        cids: notificationEntries.map(\.entry.cid)
                    )
                }

                guard let content = bestAttemptContent else {
                    os_log("fetchAndUpdate: bestAttemptContent is nil, cannot update badge", log: nseLog, type: .error)
                    return
                }

                let decryptedMessages = notificationEntries.compactMap { timedEntry -> NSEDecryptedNotificationMessage? in
                    do {
                        return try self.crypto.decryptNotificationMessage(from: timedEntry.entry, teamId: teamId)
                    } catch {
                        os_log(
                            "fetchAndUpdate: failed to decrypt entry %{public}@: %{public}@",
                            log: nseLog,
                            type: .error,
                            timedEntry.entry.cid,
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

                let badgeIncrement = decryptedMessages.isEmpty ? notificationEntries.count : decryptedMessages.count
                let defaults = UserDefaults(suiteName: Self.appGroupIdentifier) ?? UserDefaults.standard
                let storedBadgeCount = max(0, defaults.integer(forKey: Self.badgeCountKey))
                let newBadge = storedBadgeCount + badgeIncrement
                os_log("fetchAndUpdate: updating badge to %{public}d", log: nseLog, type: .info, newBadge)
                defaults.set(newBadge, forKey: Self.badgeCountKey)
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
