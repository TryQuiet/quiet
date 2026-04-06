import UserNotifications
import os.log

private let nseLog = OSLog(subsystem: "com.quietmobile.QuietNotificationServiceExtension", category: "NotificationService")

class NotificationService: UNNotificationServiceExtension {
    private static let appGroupIdentifier = "group.com.quietmobile"
    private static let badgeCountKey = "quiet.nse.badgeCount"

    private struct DecryptedEntry {
        let entry: LogEntry
        let message: NSEDecryptedNotificationMessage
    }

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var fetchTask: Task<Void, Never>?

    private let crypto = NSECryptoService()
    private var authCache: [URL: NSEAuthService] = [:]

    private static func channelName(from channelId: String) -> String {
        guard let separatorIndex = channelId.firstIndex(of: "_") else {
            return channelId
        }
        return String(channelId[..<separatorIndex])
    }

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

            let afterSeq = NSEKeychainHelper.getLastSyncSeq()
            os_log("fetchAndUpdate: fetching entries afterSeq=%{public}lld",
                   log: nseLog, type: .info, afterSeq)

            let response = try await auth.fetchNewEntries(teamId: teamId, afterSeq: afterSeq)
            let entries = response.entries
            let baselineSeq = afterSeq
            os_log("fetchAndUpdate: fetched %{public}d entries",
                   log: nseLog, type: .info, entries.count)

            guard !Task.isCancelled else {
                os_log("fetchAndUpdate: task cancelled after fetch", log: nseLog, type: .info)
                return
            }

            if entries.isEmpty {
                os_log("fetchAndUpdate: no new entries, delivering as-is", log: nseLog, type: .info)
            } else {
                let unseenEntries = entries.filter { $0.syncSeq > baselineSeq }

                if unseenEntries.isEmpty {
                    os_log("fetchAndUpdate: no unseen entries after cursor filtering", log: nseLog, type: .info)
                    return
                }

                let sortedEntries = unseenEntries.sorted { lhs, rhs in
                    lhs.syncSeq < rhs.syncSeq
                }

                let notificationEntries = sortedEntries
                let maxSyncSeq = notificationEntries.map(\.syncSeq).max() ?? baselineSeq
                os_log(
                    "fetchAndUpdate: saving sync seq=%{public}lld",
                    log: nseLog,
                    type: .info,
                    maxSyncSeq
                )
                NSEKeychainHelper.saveLastSyncSeq(maxSyncSeq)

                guard let content = bestAttemptContent else {
                    os_log("fetchAndUpdate: bestAttemptContent is nil, cannot update badge", log: nseLog, type: .error)
                    return
                }

                let decryptedEntries = notificationEntries.compactMap { entry -> DecryptedEntry? in
                    do {
                        guard let message = try self.crypto.decryptNotificationMessage(from: entry, teamId: teamId) else {
                            return nil
                        }
                        return DecryptedEntry(entry: entry, message: message)
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

                let badgeIncrement = decryptedEntries.isEmpty ? notificationEntries.count : decryptedEntries.count
                let defaults = UserDefaults(suiteName: Self.appGroupIdentifier) ?? UserDefaults.standard
                let storedBadgeCount = max(0, defaults.integer(forKey: Self.badgeCountKey))
                let newBadge = storedBadgeCount + badgeIncrement
                let badgeNumber = NSNumber(value: newBadge)
                os_log("fetchAndUpdate: updating badge to %{public}d", log: nseLog, type: .info, newBadge)
                defaults.set(newBadge, forKey: Self.badgeCountKey)

                if let latestDecryptedEntry = decryptedEntries.last {
                    for decryptedEntry in decryptedEntries.dropLast() {
                        let scheduledContent = self.makeNotificationContent(
                            from: content,
                            message: decryptedEntry.message,
                            badge: badgeNumber
                        )
                        await self.scheduleNotification(
                            identifier: "quiet.nse.synced.\(decryptedEntry.entry.cid)",
                            content: scheduledContent
                        )
                    }

                    self.applyNotificationMessage(latestDecryptedEntry.message, to: content)
                    content.badge = badgeNumber

                    os_log(
                        "fetchAndUpdate: emitted %{public}d per-entry notification(s)",
                        log: nseLog,
                        type: .info,
                        decryptedEntries.count
                    )
                } else {
                    os_log("fetchAndUpdate: no decryptable channel messages found", log: nseLog, type: .info)
                    content.badge = badgeNumber
                }
            }
        } catch {
            os_log("fetchAndUpdate failed: %{public}@", log: nseLog, type: .error, String(describing: error))
        }
    }

    private func applyNotificationMessage(_ message: NSEDecryptedNotificationMessage, to content: UNMutableNotificationContent) {
        content.title = "#\(Self.channelName(from: message.channelId))"
        content.body = message.body
        content.threadIdentifier = message.channelId
    }

    private func makeNotificationContent(
        from template: UNNotificationContent,
        message: NSEDecryptedNotificationMessage,
        badge: NSNumber
    ) -> UNMutableNotificationContent {
        let content = (template.mutableCopy() as? UNMutableNotificationContent) ?? UNMutableNotificationContent()
        applyNotificationMessage(message, to: content)
        content.badge = badge
        return content
    }

    private func scheduleNotification(identifier: String, content: UNNotificationContent) async {
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
        await withCheckedContinuation { continuation in
            UNUserNotificationCenter.current().add(request) { error in
                if let error {
                    os_log(
                        "fetchAndUpdate: failed to schedule notification %{public}@: %{public}@",
                        log: nseLog,
                        type: .error,
                        identifier,
                        String(describing: error)
                    )
                }
                continuation.resume()
            }
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
