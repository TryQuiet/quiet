import UserNotifications
import os.log

private let nseLog = OSLog(subsystem: "com.quietmobile.QuietNotificationServiceExtension", category: "NotificationService")

class NotificationService: UNNotificationServiceExtension {
    private struct ProcessedEntry {
        let entry: LogEntry
        let message: NSEDecryptedNotificationMessage?
        let retryableFailure: Bool
    }

    private static let retryDelaysNanoseconds: [UInt64] = [
        250_000_000,
        750_000_000
    ]

    private static let maxRetryWindow: TimeInterval = 5

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var fetchTask: Task<Void, Never>?
    private var pendingSyncSeq: Int64?

    private let crypto = NSECryptoService()
    private let tokenCache = NSEAuthTokenCache()

    private static func getChannelName(teamId: String, channelId: String) -> String {
      do {
        let channelName = try KeychainService.getChannelName(teamId: teamId, channelId: channelId)
        return channelName
      } catch {
        os_log("getChannelName failed: %{public}@", log: nseLog, type: .error, String(describing: error))
        return channelId
      }
    }

    private static func getNickname(userId: String) -> String {
        do {
            return try KeychainService.getNickname(userId: userId)
        } catch {
            os_log("getNickname failed: %{public}@", log: nseLog, type: .error, String(describing: error))
            return userId
        }
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

        if SharedDefaults.isMainAppForeground() {
            os_log("fetchAndUpdate: app is foregrounded, skipping NSE fetch/decrypt work", log: nseLog, type: .info)
            return
        }

        guard let teamId = userInfo["teamId"] as? String else {
            os_log("fetchAndUpdate: missing 'teamId' in userInfo; payload keys=%{public}@",
                   log: nseLog, type: .error,
                   userInfo.keys.map { "\($0)" }.sorted().joined(separator: ", "))
            return
        }

        let storedQssUrl = SharedDefaults.getQssUrl(teamId: teamId)
        let qssUrl: URL
        if let url = storedQssUrl {
            qssUrl = url
        } else if let fallback = SharedDefaults.getFallbackQssUrl() {
            os_log("fetchAndUpdate: no team-specific QSS URL for teamId=%{public}@, using env fallback",
                   log: nseLog, type: .info, teamId)
            qssUrl = fallback
        } else {
            os_log("fetchAndUpdate: missing QSS URL for teamId=%{public}@ and no fallback configured",
                   log: nseLog, type: .error, teamId)
            return
        }
        let qssUrlString = qssUrl.absoluteString


        os_log("fetchAndUpdate: teamId=%{public}@ qssUrl=%{public}@",
               log: nseLog, type: .info, teamId, qssUrlString)

        do {
            let afterSeq = SharedDefaults.getLastSyncSeq()
            os_log("fetchAndUpdate: fetching entries afterSeq=%{public}lld",
                   log: nseLog, type: .info, afterSeq)

            let response = try await fetchEntriesWithRetry(qssUrl: qssUrl, teamId: teamId, afterSeq: afterSeq)
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

                var notificationEntries: [LogEntry] = []
                var expectedSyncSeq = baselineSeq + 1
                for entry in sortedEntries {
                    guard entry.syncSeq == expectedSyncSeq else {
                        os_log(
                            "fetchAndUpdate: stopping at non-contiguous sync seq; expected=%{public}lld actual=%{public}lld",
                            log: nseLog,
                            type: .error,
                            expectedSyncSeq,
                            entry.syncSeq
                        )
                        break
                    }
                    notificationEntries.append(entry)
                    expectedSyncSeq += 1
                }

                guard let content = bestAttemptContent else {
                    os_log("fetchAndUpdate: bestAttemptContent is nil, cannot update badge", log: nseLog, type: .error)
                    return
                }

                let processedEntries = notificationEntries.map { entry -> ProcessedEntry in
                    do {
                        let message = try self.crypto.decryptNotificationMessage(from: entry, teamId: teamId)
                        return ProcessedEntry(entry: entry, message: message, retryableFailure: false)
                    } catch {
                        os_log(
                            "fetchAndUpdate: failed to decrypt entry %{public}@: %{public}@",
                            log: nseLog,
                            type: .error,
                            entry.cid,
                            String(describing: error)
                        )
                        if NSENotificationFailurePolicy.isRetryable(error) {
                            // Keychain propagation can lag behind the push. Preserve this entry for
                            // a later wake-up rather than treating a valid message as malformed.
                            return ProcessedEntry(entry: entry, message: nil, retryableFailure: true)
                        }
                        // Authentication failures are permanent for this immutable entry. Treat it
                        // as rejected and consume its sequence so it cannot poison later delivery.
                        return ProcessedEntry(entry: entry, message: nil, retryableFailure: false)
                    }
                }
                let storedBadgeCount = SharedDefaults.getBadgeCount()
                let lastDisplayableIndex = processedEntries.lastIndex { $0.message != nil }
                var displayedCount = 0
                var lastProcessedSeq = baselineSeq

                for (index, processedEntry) in processedEntries.enumerated() {
                    if processedEntry.retryableFailure {
                        break
                    }
                    guard let message = processedEntry.message else {
                        lastProcessedSeq = NSENotificationCursorPolicy.cursor(
                            after: lastProcessedSeq,
                            processing: processedEntry.entry.syncSeq,
                            outcome: .rejected
                        )
                        pendingSyncSeq = lastProcessedSeq
                        continue
                    }

                    let nextBadge = NSNumber(value: storedBadgeCount + displayedCount + 1)
                    if let lastDisplayableIndex, index == lastDisplayableIndex {
                        self.applyNotificationMessage(message, teamId: teamId, to: content)
                        content.badge = nextBadge
                    } else {
                        let scheduledContent = self.makeNotificationContent(
                            from: content,
                            message: message,
                            teamId: teamId,
                            badge: nextBadge
                        )
                        let scheduled = await self.scheduleNotification(
                            identifier: "quiet.nse.synced.\(processedEntry.entry.cid)",
                            content: scheduledContent
                        )
                        guard scheduled else {
                            // This valid message was not delivered. Leave it and every later entry
                            // beyond the cursor so a later provider wake-up can retry them.
                            lastProcessedSeq = NSENotificationCursorPolicy.cursor(
                                after: lastProcessedSeq,
                                processing: processedEntry.entry.syncSeq,
                                outcome: .deliveryFailed
                            )
                            break
                        }
                    }
                    displayedCount += 1
                    lastProcessedSeq = NSENotificationCursorPolicy.cursor(
                        after: lastProcessedSeq,
                        processing: processedEntry.entry.syncSeq,
                        outcome: .delivered
                    )
                    pendingSyncSeq = lastProcessedSeq
                }

                if displayedCount > 0 {
                    let newBadge = storedBadgeCount + displayedCount
                    SharedDefaults.setBadgeCount(newBadge)
                    content.badge = NSNumber(value: newBadge)
                }
                os_log(
                    "fetchAndUpdate: authenticated %{public}d notification(s), safe cursor=%{public}lld",
                    log: nseLog,
                    type: .info,
                    displayedCount,
                    lastProcessedSeq
                )
            }
        } catch {
            os_log("fetchAndUpdate failed: %{public}@", log: nseLog, type: .error, String(describing: error))
        }
    }

    private func fetchEntriesWithRetry(qssUrl: URL, teamId: String, afterSeq: Int64) async throws -> LogEntriesResponse {
        let startedAt = Date()
        var retryIndex = 0

        while true {
            guard !Task.isCancelled else {
                throw CancellationError()
            }

            do {
                let auth = makeAuthService(qssUrl: qssUrl)
                return try await auth.fetchNewEntries(teamId: teamId, afterSeq: afterSeq)
            } catch {
                guard shouldRetryFetch(error: error, startedAt: startedAt, retryIndex: retryIndex) else {
                    throw error
                }

                let delay = Self.retryDelaysNanoseconds[retryIndex]
                retryIndex += 1
                os_log(
                    "fetchAndUpdate: retrying full auth fetch after transient network error (%{public}d/%{public}d): %{public}@",
                    log: nseLog,
                    type: .info,
                    retryIndex,
                    Self.retryDelaysNanoseconds.count,
                    String(describing: error)
                )
                try await Task.sleep(nanoseconds: delay)
            }
        }
    }

    private func makeAuthService(qssUrl: URL) -> NSEAuthService {
        os_log("fetchAndUpdate: creating fresh NSEAuthService for %{public}@",
               log: nseLog, type: .debug, qssUrl.absoluteString)
        let client = NSENetworkClient(baseURL: qssUrl)
        return NSEAuthService(client: client, crypto: crypto, tokenCache: tokenCache)
    }

    private func shouldRetryFetch(error: Error, startedAt: Date, retryIndex: Int) -> Bool {
        guard retryIndex < Self.retryDelaysNanoseconds.count else {
            return false
        }

        guard Date().timeIntervalSince(startedAt) < Self.maxRetryWindow else {
            return false
        }

        guard let authError = error as? NSEAuthError else {
            return false
        }

        switch authError {
        case .networkError:
            return authError.isRetryableNetworkFailure
        case .logFetchFailed(let statusCode) where statusCode == 502 || statusCode == 503:
            // Proxy (iCloud Private Relay) or gateway transiently unavailable.
            return true
        default:
            return false
        }
    }

    private func applyNotificationMessage(_ message: NSEDecryptedNotificationMessage, teamId: String, to content: UNMutableNotificationContent) {
        content.title = NSENotificationPresentation.title(
            channelName: Self.getChannelName(teamId: teamId, channelId: message.channelId),
            authenticatedAuthor: Self.getNickname(userId: message.userId)
        )
        content.body = message.body
        content.threadIdentifier = message.channelId
    }

    private func makeNotificationContent(
        from template: UNNotificationContent,
        message: NSEDecryptedNotificationMessage,
        teamId: String,
        badge: NSNumber
    ) -> UNMutableNotificationContent {
        let content = (template.mutableCopy() as? UNMutableNotificationContent) ?? UNMutableNotificationContent()
      applyNotificationMessage(message, teamId: teamId, to: content)
        content.badge = badge
        return content
    }

    private func scheduleNotification(identifier: String, content: UNNotificationContent) async -> Bool {
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
        return await withCheckedContinuation { continuation in
            UNUserNotificationCenter.current().add(request) { error in
                if let error {
                    os_log(
                        "fetchAndUpdate: failed to schedule notification %{public}@: %{public}@",
                        log: nseLog,
                        type: .error,
                        identifier,
                        String(describing: error)
                    )
                    continuation.resume(returning: false)
                    return
                }
                continuation.resume(returning: true)
            }
        }
    }

    private func deliver() {
        guard let handler = contentHandler, let content = bestAttemptContent else { return }
        // Nil contentHandler first to prevent double-delivery if serviceExtensionTimeWillExpire
        // races with task completion — both paths call deliver(), only the first wins.
        contentHandler = nil
        // Persist the seq cursor only at the moment of delivery so a mid-run NSE kill
        // (XPC_ERROR_CONNECTION_INTERRUPTED) cannot advance the cursor past undelivered entries.
        if let seq = pendingSyncSeq {
            SharedDefaults.saveLastSyncSeq(seq)
            pendingSyncSeq = nil
        }
        handler(content)
    }
}
