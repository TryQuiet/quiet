import Foundation

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

    func fetchLogEntries(teamId: String, since: Int64, token: String) async throws -> LogEntriesResponse {
        guard let urlComponents = URLComponents(
            url: baseURL.appendingPathComponent("nse-auth/logs/\(teamId)"),
            resolvingAgainstBaseURL: false
        ) else { throw NSEAuthError.invalidResponse }
        var components = urlComponents
        components.queryItems = [URLQueryItem(name: "since", value: String(since))]

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
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw NSEAuthError.networkError(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw NSEAuthError.invalidResponse
        }

        guard (200..<300).contains(http.statusCode) else {
            try onError(http.statusCode)
            throw NSEAuthError.invalidResponse // unreachable; onError always throws
        }

        do {
            return try Self.decoder.decode(T.self, from: data)
        } catch {
            throw NSEAuthError.decodingFailed(error)
        }
    }
}
