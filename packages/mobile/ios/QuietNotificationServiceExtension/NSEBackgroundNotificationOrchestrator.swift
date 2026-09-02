import Foundation

struct NSEPreparedNotification {
    let identifier: String
    let presentation: NSEPreparedNotificationPresentation
    let badge: Int
}

struct NSEBackgroundNotificationDelivery {
    let notifications: [NSEPreparedNotification]
    let badge: Int?
}

/// Production core for the background notification transaction. It owns the
/// ordering boundary from authenticated fetch through delivery and persists
/// only the contiguous prefix that was confirmed delivered or rejected.
final class NSEBackgroundNotificationOrchestrator {
    func run(
        teamId: String,
        baselineSeq: Int64,
        crypto: DeviceCryptography,
        fetch: () async throws -> LogEntriesResponse,
        channelName: (String) -> String,
        authenticatedAuthor: (String) -> String,
        storedBadge: () -> Int,
        saveBadge: (Int) -> Void,
        recordMissingNotificationKeyFailure: (String, Int64) -> Int,
        clearMissingNotificationKeyFailure: (String, Int64) -> Void,
        stageCursor: (Int64) -> Void,
        deliver: (NSEBackgroundNotificationDelivery) async -> Bool,
        persistCursor: (Int64) -> Void
    ) async throws {
        let response = try await fetch()
        guard !Task.isCancelled else {
            throw CancellationError()
        }

        let entries = response.entries
            .filter { $0.syncSeq > baselineSeq }
            .sorted { $0.syncSeq < $1.syncSeq }

        guard !entries.isEmpty else {
            _ = await deliver(NSEBackgroundNotificationDelivery(notifications: [], badge: nil))
            return
        }

        let initialBadge = storedBadge()
        var notifications: [NSEPreparedNotification] = []
        var lastProcessedSeq = baselineSeq

        for entry in entries {
            guard entry.syncSeq == lastProcessedSeq + 1 else {
                break
            }

            do {
                guard let message = try crypto.decryptNotificationMessage(from: entry, teamId: teamId) else {
                    clearMissingNotificationKeyFailure(teamId, entry.syncSeq)
                    lastProcessedSeq = entry.syncSeq
                    continue
                }

                clearMissingNotificationKeyFailure(teamId, entry.syncSeq)
                let badge = initialBadge + notifications.count + 1
                notifications.append(
                    NSEPreparedNotification(
                        identifier: "quiet.nse.synced.\(entry.cid)",
                        presentation: NSENotificationPresenter.makePresentation(
                            message: message,
                            channelName: channelName(message.channelId),
                            authenticatedAuthor: authenticatedAuthor(message.userId)
                        ),
                        badge: badge
                    )
                )
                lastProcessedSeq = entry.syncSeq
            } catch {
                if NSENotificationFailurePolicy.isRetryable(error) {
                    let failureCount = recordMissingNotificationKeyFailure(teamId, entry.syncSeq)
                    if NSENotificationRetryPolicy.shouldRetryMissingKey(failureCount: failureCount) {
                        break
                    }
                }

                // Permanent authentication failures, and missing-key failures after a bounded
                // propagation window, are rejected so one immutable entry cannot poison the log.
                clearMissingNotificationKeyFailure(teamId, entry.syncSeq)
                lastProcessedSeq = entry.syncSeq
            }
        }

        guard lastProcessedSeq > baselineSeq else {
            _ = await deliver(NSEBackgroundNotificationDelivery(notifications: [], badge: nil))
            return
        }

        stageCursor(lastProcessedSeq)
        let badge = notifications.last?.badge
        let didDeliver = await deliver(
            NSEBackgroundNotificationDelivery(notifications: notifications, badge: badge)
        )
        guard didDeliver else { return }

        if let badge {
            saveBadge(badge)
        }
        persistCursor(lastProcessedSeq)
    }
}
