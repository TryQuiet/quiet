import Foundation

/// Shared UserDefaults state used by both the main app and the NSE.
/// All keys live in the app group suite so both processes see the same values.
struct SharedDefaults {
    static let suiteName = "group.com.quietmobile"

    // MARK: - Keys

    static let lastSyncSeqKey     = "quiet.nse.lastSyncSeq"
    static let lastSyncTeamIdKey  = "quiet.nse.lastSyncTeamId"
    static let missingKeyRetrySeqByTeamKey = "quiet.nse.missingKeyRetrySeqByTeam"
    static let missingKeyRetryCountByTeamKey = "quiet.nse.missingKeyRetryCountByTeam"
    static let qssUrlsKey         = "quiet.nse.qssUrls"
    static let qssFallbackUrlKey  = "quiet.nse.qssFallbackUrl"
    static let badgeCountKey      = "quiet.nse.badgeCount"
    static let appIsForegroundKey = "quiet.app.isForeground"

    static let defaults: UserDefaults = {
        guard let suite = UserDefaults(suiteName: suiteName) else {
            fatalError("SharedDefaults: failed to create UserDefaults for suite '\(suiteName)' — check app group entitlements")
        }
        return suite
    }()

    // MARK: - Foreground state

    static func setAppForeground(_ foreground: Bool) {
        defaults.set(foreground, forKey: appIsForegroundKey)
    }

    static func isMainAppForeground() -> Bool {
        defaults.bool(forKey: appIsForegroundKey)
    }

    // MARK: - Badge count

    static func getBadgeCount() -> Int {
        max(0, defaults.integer(forKey: badgeCountKey))
    }

    static func setBadgeCount(_ count: Int) {
        defaults.set(count, forKey: badgeCountKey)
    }

    // MARK: - Sync seq

    static func getLastSyncSeq() -> Int64 {
        defaults.object(forKey: lastSyncSeqKey) as? Int64 ?? Int64(defaults.integer(forKey: lastSyncSeqKey))
    }

    static func saveLastSyncSeq(_ seq: Int64) {
        let current = getLastSyncSeq()
        let newSeq = max(current, seq)
        defaults.set(newSeq, forKey: lastSyncSeqKey)
    }

    static func saveLastSyncSeqAndTeam(_ seq: Int64, teamId: String) {
        let current = getLastSyncSeq()
        guard seq > current else { return }
        defaults.set(seq, forKey: lastSyncSeqKey)
        defaults.set(teamId, forKey: lastSyncTeamIdKey)
    }

    /// Record the one entry that can currently block each team's contiguous NSE cursor. A
    /// different sequence resets that team's counter without disturbing another team's retries.
    static func recordMissingNotificationKeyFailure(teamId: String, syncSeq: Int64) -> Int {
        var sequences = defaults.dictionary(forKey: missingKeyRetrySeqByTeamKey) ?? [:]
        var counts = defaults.dictionary(forKey: missingKeyRetryCountByTeamKey) ?? [:]
        let previousSequence = (sequences[teamId] as? NSNumber)?.int64Value
        let previousCount = previousSequence == syncSeq ? (counts[teamId] as? NSNumber)?.intValue ?? 0 : 0
        let nextCount = previousCount == Int.max ? Int.max : previousCount + 1
        sequences[teamId] = NSNumber(value: syncSeq)
        counts[teamId] = NSNumber(value: nextCount)
        defaults.set(sequences, forKey: missingKeyRetrySeqByTeamKey)
        defaults.set(counts, forKey: missingKeyRetryCountByTeamKey)
        return nextCount
    }

    static func clearMissingNotificationKeyFailure(teamId: String, syncSeq: Int64) {
        var sequences = defaults.dictionary(forKey: missingKeyRetrySeqByTeamKey) ?? [:]
        guard (sequences[teamId] as? NSNumber)?.int64Value == syncSeq else { return }
        var counts = defaults.dictionary(forKey: missingKeyRetryCountByTeamKey) ?? [:]
        sequences.removeValue(forKey: teamId)
        counts.removeValue(forKey: teamId)
        defaults.set(sequences, forKey: missingKeyRetrySeqByTeamKey)
        defaults.set(counts, forKey: missingKeyRetryCountByTeamKey)
    }

    // MARK: - QSS URLs

    static func getQssUrl(teamId: String) -> URL? {
        guard
            let qssUrls = defaults.dictionary(forKey: qssUrlsKey) as? [String: String],
            let urlString = qssUrls[teamId]
        else { return nil }
        return URL(string: urlString)
    }

    static func saveQssUrl(teamId: String, url: String) {
        var existing = defaults.dictionary(forKey: qssUrlsKey) as? [String: String] ?? [:]
        existing[teamId] = url
        defaults.set(existing, forKey: qssUrlsKey)
    }

    static func getFallbackQssUrl() -> URL? {
        guard let urlString = defaults.string(forKey: qssFallbackUrlKey), !urlString.isEmpty else {
            return nil
        }
        return URL(string: urlString)
    }

    static func saveFallbackQssUrl(_ url: String) {
        defaults.set(url, forKey: qssFallbackUrlKey)
    }

    // MARK: - Clear all

    static func clearAll() {
        defaults.removeObject(forKey: lastSyncSeqKey)
        defaults.removeObject(forKey: lastSyncTeamIdKey)
        defaults.removeObject(forKey: missingKeyRetrySeqByTeamKey)
        defaults.removeObject(forKey: missingKeyRetryCountByTeamKey)
        defaults.removeObject(forKey: qssUrlsKey)
        defaults.removeObject(forKey: badgeCountKey)
    }
}
