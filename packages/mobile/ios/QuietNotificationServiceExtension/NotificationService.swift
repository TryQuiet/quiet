import UserNotifications
import os.log

private let nseLog = OSLog(subsystem: "com.quietmobile.QuietNotificationServiceExtension", category: "NotificationService")

class NotificationService: UNNotificationServiceExtension {
    private static let retryDelaysNanoseconds: [UInt64] = [
        250_000_000,
        750_000_000
    ]

    private static let maxRetryWindow: TimeInterval = 5

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    var fetchTask: Task<Void, Never>?

    private let crypto = NSECryptoService(lfaKeyReader: KeychainNSELFAKeyReader())
    private let backgroundOrchestrator = NSEBackgroundNotificationOrchestrator()
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

    private static func getNickname(userId: String) -> String? {
        do {
            return try KeychainService.getNickname(userId: userId)
        } catch {
            os_log("getNickname failed: %{public}@", log: nseLog, type: .error, String(describing: error))
            return nil
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
        applySafeFallback(to: bestAttemptContent)

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

    private func applySafeFallback(to content: UNMutableNotificationContent?) {
        guard let content else { return }

        let fallback = NSENotificationPresenter.makeSafeFallback(
            replacingUntrustedTitle: content.title,
            body: content.body
        )
        content.title = fallback.title
        content.body = fallback.body
    }

    private func fetchAndUpdate(userInfo: [AnyHashable: Any]) async {
        defer { _ = deliver() }

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
        guard let qssServerId = SharedDefaults.getQssServerId(teamId: teamId) else {
            os_log("fetchAndUpdate: missing pinned QSS server identity for teamId=%{public}@", log: nseLog, type: .error, teamId)
            return
        }

        os_log("fetchAndUpdate: teamId=%{public}@ qssUrl=%{public}@",
               log: nseLog, type: .info, teamId, qssUrlString)

        do {
            let afterSeq = SharedDefaults.getLastSyncSeq()
            os_log("fetchAndUpdate: fetching entries afterSeq=%{public}lld",
                   log: nseLog, type: .info, afterSeq)
            try await backgroundOrchestrator.run(
                teamId: teamId,
                baselineSeq: afterSeq,
                localUserId: try? KeychainService.getLocalUserId(teamId: teamId),
                crypto: crypto,
                fetch: {
                    try await self.fetchEntriesWithRetry(
                        qssUrl: qssUrl,
                        teamId: teamId,
                        qssServerId: qssServerId,
                        afterSeq: afterSeq
                    )
                },
                channelName: { Self.getChannelName(teamId: teamId, channelId: $0) },
                authenticatedAuthor: { Self.getNickname(userId: $0) },
                storedBadge: SharedDefaults.getBadgeCount,
                saveBadge: SharedDefaults.setBadgeCount,
                recordMissingNotificationKeyFailure: SharedDefaults.recordMissingNotificationKeyFailure,
                clearMissingNotificationKeyFailure: SharedDefaults.clearMissingNotificationKeyFailure,
                stageCursor: { seq in
                    os_log(
                        "fetchAndUpdate: staging sync seq=%{public}lld (saved after delivery)",
                        log: nseLog,
                        type: .info,
                        seq
                    )
                },
                deliver: { delivery in
                    await self.applyAndDeliver(delivery)
                },
                persistCursor: SharedDefaults.saveLastSyncSeq
            )
        } catch {
            os_log("fetchAndUpdate failed: %{public}@", log: nseLog, type: .error, String(describing: error))
        }
    }

    private func fetchEntriesWithRetry(qssUrl: URL, teamId: String, qssServerId: String, afterSeq: Int64) async throws -> LogEntriesResponse {
        let startedAt = Date()
        var retryIndex = 0

        while true {
            guard !Task.isCancelled else {
                throw CancellationError()
            }

            do {
                let auth = makeAuthService(qssUrl: qssUrl)
                return try await auth.fetchNewEntries(teamId: teamId, qssServerId: qssServerId, afterSeq: afterSeq)
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
        return NSEAuthService(
            client: client,
            crypto: crypto,
            credentials: KeychainNSEDeviceCredentials(),
            tokenCache: tokenCache
        )
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

    private func applyPresentation(_ presentation: NSEPreparedNotificationPresentation, to content: UNMutableNotificationContent) {
        content.title = presentation.title
        content.body = presentation.body
        content.threadIdentifier = presentation.threadIdentifier
    }

    private func makeNotificationContent(
        from template: UNNotificationContent,
        presentation: NSEPreparedNotificationPresentation,
        badge: NSNumber
    ) -> UNMutableNotificationContent {
        let content = (template.mutableCopy() as? UNMutableNotificationContent) ?? UNMutableNotificationContent()
        applyPresentation(presentation, to: content)
        content.badge = badge
        return content
    }

    private func applyAndDeliver(_ delivery: NSEBackgroundNotificationDelivery) async -> Bool {
        guard let content = bestAttemptContent else {
            return false
        }

        if let badge = delivery.badge {
            let badgeNumber = NSNumber(value: badge)
            if let latest = delivery.notifications.last {
                for notification in delivery.notifications.dropLast() {
                    let scheduledContent = makeNotificationContent(
                        from: content,
                        presentation: notification.presentation,
                        badge: NSNumber(value: notification.badge)
                    )
                    let scheduled = await scheduleNotification(
                        identifier: notification.identifier,
                        content: scheduledContent
                    )
                    guard scheduled else { return false }
                }
                applyPresentation(latest.presentation, to: content)
            }
            content.badge = badgeNumber
        }

        return deliver()
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

    @discardableResult
    private func deliver() -> Bool {
        guard let handler = contentHandler, let content = bestAttemptContent else { return false }
        // Nil contentHandler first to prevent double-delivery if serviceExtensionTimeWillExpire
        // races with task completion — both paths call deliver(), only the first wins.
        contentHandler = nil
        handler(content)
        return true
    }
}
