import Foundation
import os.log

private let netLog = OSLog(subsystem: "com.quietmobile.QuietNotificationServiceExtension", category: "NSENetworkClient")

class NSENetworkClient {
    let baseURL: URL
    let session: URLSession

    // Shared encoder/decoder to avoid reallocating on every call.
    private static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = .sortedKeys
        return e
    }()

    private static let decoder = JSONDecoder()

    // Dedicated session with tight timeouts suitable for an NSE (30-second budget).
    private static let defaultSession: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 20
        return URLSession(configuration: config)
    }()

    init(baseURL: URL, session: URLSession? = nil) {
        self.baseURL = baseURL
        self.session = session ?? NSENetworkClient.defaultSession
    }

    // MARK: - POST /nse-auth/challenge

    func requestChallenge(deviceId: String, teamId: String) async throws -> ChallengeResponse {
        let url = baseURL.appendingPathComponent("nse-auth/challenge")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["deviceId": deviceId, "teamId": teamId]
        request.httpBody = try Self.encoder.encode(body)

        return try await perform(request: request, as: ChallengeResponse.self) { code in
            throw NSEAuthError.challengeRequestFailed(statusCode: code)
        }
    }

    // MARK: - POST /nse-auth/token

    func requestToken(challengeId: String, deviceId: String, proof: ProofPayload) async throws -> TokenResponse {
        let url = baseURL.appendingPathComponent("nse-auth/token")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = TokenRequest(challengeId: challengeId, deviceId: deviceId, proof: proof)
        request.httpBody = try Self.encoder.encode(body)

        return try await perform(request: request, as: TokenResponse.self) { code in
            throw NSEAuthError.tokenRequestFailed(statusCode: code)
        }
    }

    // MARK: - GET /nse-auth/logs/:teamId

    func fetchLogEntries(teamId: String, afterSeq: Int64, token: String) async throws -> LogEntriesResponse {
        guard let urlComponents = URLComponents(
            url: baseURL.appendingPathComponent("nse-auth/logs/\(teamId)"),
            resolvingAgainstBaseURL: false
        ) else { throw NSEAuthError.invalidResponse }
        var components = urlComponents
        components.queryItems = [URLQueryItem(name: "afterSeq", value: String(afterSeq))]

        guard let url = components.url else { throw NSEAuthError.invalidResponse }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        return try await perform(request: request, as: LogEntriesResponse.self) { code in
            throw NSEAuthError.logFetchFailed(statusCode: code)
        }
    }

    // MARK: - Private helper

    private func perform<T: Decodable>(
        request: URLRequest,
        as type: T.Type,
        onError: (Int) throws -> Void
    ) async throws -> T {
        let method = request.httpMethod ?? "GET"
        let urlStr = request.url?.absoluteString ?? "(nil)"
        os_log("perform: %{public}@ %{public}@", log: netLog, type: .debug, method, urlStr)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            os_log("perform: network error for %{public}@: %{public}@", log: netLog, type: .error, urlStr, String(describing: error))
            throw NSEAuthError.networkError(error)
        }

        guard let http = response as? HTTPURLResponse else {
            os_log("perform: non-HTTP response for %{public}@", log: netLog, type: .error, urlStr)
            throw NSEAuthError.invalidResponse
        }

        os_log("perform: %{public}@ %{public}@ → HTTP %{public}d", log: netLog, type: .info, method, urlStr, http.statusCode)

        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? "(non-UTF8 body)"
            os_log("perform: error body: %{public}@", log: netLog, type: .error, body)
            try onError(http.statusCode)
            throw NSEAuthError.invalidResponse // unreachable; onError always throws
        }

        do {
            return try Self.decoder.decode(T.self, from: data)
        } catch {
            let body = String(data: data, encoding: .utf8) ?? "(non-UTF8 body)"
            os_log("perform: decoding failed for %{public}@: %{public}@\nresponse body: %{public}@",
                   log: netLog, type: .error, String(describing: T.self), String(describing: error), body)
            throw NSEAuthError.decodingFailed(error)
        }
    }
}
