import Foundation
import os.log

private let authLog = OSLog(subsystem: "com.quietmobile.QuietNotificationServiceExtension", category: "NSEAuthService")

struct NSEAuthTokenCacheKey: Hashable {
    let qssUrl: URL
    let teamId: String
}

final class NSEAuthTokenCache {
    private let lock = NSLock()
    private var tokens: [NSEAuthTokenCacheKey: (token: String, expiry: Date)] = [:]

    func token(for qssUrl: URL, teamId: String, now: Date = Date()) -> (token: String, expiry: Date)? {
        let key = NSEAuthTokenCacheKey(qssUrl: qssUrl, teamId: teamId)
        lock.lock()
        defer { lock.unlock() }

        guard let cached = tokens[key] else {
            return nil
        }

        guard cached.expiry > now else {
            tokens.removeValue(forKey: key)
            return nil
        }

        return cached
    }

    func store(token: String, expiresIn: Int, for qssUrl: URL, teamId: String, now: Date = Date()) {
        let key = NSEAuthTokenCacheKey(qssUrl: qssUrl, teamId: teamId)
        let expiry = now.addingTimeInterval(TimeInterval(expiresIn) - 30)
        lock.lock()
        tokens[key] = (token: token, expiry: expiry)
        lock.unlock()
    }

    func removeToken(for qssUrl: URL, teamId: String) {
        let key = NSEAuthTokenCacheKey(qssUrl: qssUrl, teamId: teamId)
        lock.lock()
        tokens.removeValue(forKey: key)
        lock.unlock()
    }
}

class NSEAuthService {
    private let client: NSENetworkClient
    private let crypto: DeviceCryptography
    private let tokenCache: NSEAuthTokenCache

    init(client: NSENetworkClient, crypto: DeviceCryptography, tokenCache: NSEAuthTokenCache = NSEAuthTokenCache()) {
        self.client = client
        self.crypto = crypto
        self.tokenCache = tokenCache
    }

    // MARK: - Full auth flow

    func authenticate(deviceId: String, teamId: String) async throws -> String {
        if let cached = tokenCache.token(for: client.baseURL, teamId: teamId) {
            os_log("authenticate: using cached token for teamId=%{public}@, expires=%{public}@",
                   log: authLog, type: .debug, teamId, "\(cached.expiry)")
            return cached.token
        }

        os_log("authenticate: requesting challenge for deviceId=%{public}@ teamId=%{public}@",
               log: authLog, type: .info, deviceId, teamId)
        let challengeResp = try await client.requestChallenge(deviceId: deviceId, teamId: teamId)
        os_log("authenticate: got challengeId=%{public}@", log: authLog, type: .debug, challengeResp.challengeId)

        os_log("authenticate: reading device private key from keychain", log: authLog, type: .debug)
        let privateKeyData = try KeychainService.getDevicePrivateKey(deviceId: deviceId)
        os_log("authenticate: private key read (%{public}d bytes), signing challenge", log: authLog, type: .debug, privateKeyData.count)

        let proof = try crypto.signChallengePayload(challengeResp.challenge, privateKeyData: privateKeyData)
        os_log("authenticate: signed challenge, requesting token", log: authLog, type: .debug)

        let tokenResp = try await client.requestToken(
            challengeId: challengeResp.challengeId,
            deviceId: deviceId,
            proof: proof
        )
        os_log("authenticate: token received, expiresIn=%{public}d", log: authLog, type: .info, tokenResp.expiresIn)

        tokenCache.store(token: tokenResp.token, expiresIn: tokenResp.expiresIn, for: client.baseURL, teamId: teamId)

        return tokenResp.token
    }

    // MARK: - Fetch log entries

    func fetchNewEntries(teamId: String, afterSeq: Int64) async throws -> LogEntriesResponse {
        os_log("fetchNewEntries: reading deviceId from keychain", log: authLog, type: .debug)
        let deviceId = try KeychainService.getDeviceId()
        os_log("fetchNewEntries: deviceId=%{public}@, authenticating", log: authLog, type: .info, deviceId)
        let token = try await authenticate(deviceId: deviceId, teamId: teamId)
        os_log("fetchNewEntries: authenticated, fetching log entries afterSeq=%{public}lld",
               log: authLog, type: .info, afterSeq)
        do {
            let resp = try await client.fetchLogEntries(teamId: teamId, afterSeq: afterSeq, token: token)
            os_log("fetchNewEntries: received %{public}d entries", log: authLog, type: .info, resp.entries.count)
            return resp
        } catch NSEAuthError.logFetchFailed(let statusCode) where statusCode == 401 {
            os_log("fetchNewEntries: token rejected (401) for teamId=%{public}@, evicting cache and retrying",
                   log: authLog, type: .info, teamId)
            tokenCache.removeToken(for: client.baseURL, teamId: teamId)
            let freshToken = try await authenticate(deviceId: deviceId, teamId: teamId)
            let resp = try await client.fetchLogEntries(teamId: teamId, afterSeq: afterSeq, token: freshToken)
            os_log("fetchNewEntries: retry succeeded, received %{public}d entries", log: authLog, type: .info, resp.entries.count)
            return resp
        }
    }
}
