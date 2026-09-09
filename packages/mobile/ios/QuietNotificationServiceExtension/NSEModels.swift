import Foundation

// MARK: - JSON decoding

enum NSEJSON {
    /// The raw bytes being decoded, so a `Decodable` type can re-examine the JSON tokens
    /// that `JSONDecoder` has already normalized (see `ChallengePayload`).
    static let rawDataKey = CodingUserInfoKey(rawValue: "org.quiet.nse.rawJSON")!

    static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        let decoder = JSONDecoder()
        decoder.userInfo[rawDataKey] = data
        return try decoder.decode(type, from: data)
    }
}

// MARK: - Error Types

enum NSEAuthError: Error, LocalizedError {
    case challengeRequestFailed(statusCode: Int)
    case tokenRequestFailed(statusCode: Int)
    case logFetchFailed(statusCode: Int)
    case invalidResponse
    case decodingFailed(Error)
    case signingFailed
    case keychainError(String)
    case missingCredentials(String)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .challengeRequestFailed(let code): return "Challenge request failed with status \(code)"
        case .tokenRequestFailed(let code): return "Token request failed with status \(code)"
        case .logFetchFailed(let code): return "Log fetch failed with status \(code)"
        case .invalidResponse: return "Invalid or unexpected server response"
        case .decodingFailed(let err): return "Decoding failed: \(err.localizedDescription)"
        case .signingFailed: return "Failed to sign challenge"
        case .keychainError(let msg): return "Keychain error: \(msg)"
        case .missingCredentials(let field): return "Missing credential: \(field)"
        case .networkError(let err): return "Network error: \(err.localizedDescription)"
        }
    }
}

extension NSEAuthError {
    private static let retryableURLCodes: Set<Int> = [
        URLError.cannotConnectToHost.rawValue,
        URLError.networkConnectionLost.rawValue,
        URLError.timedOut.rawValue,
        URLError.notConnectedToInternet.rawValue,
        URLError.cannotFindHost.rawValue,
        URLError.dnsLookupFailed.rawValue,
        URLError.resourceUnavailable.rawValue,
        URLError.callIsActive.rawValue,
        URLError.dataNotAllowed.rawValue
    ]

    private static let retryablePOSIXCodes: Set<Int> = [53, 57, 60, 61, 64, 65]

    var isRetryableNetworkFailure: Bool {
        guard case .networkError(let error) = self else {
            return false
        }
        return Self.isRetryableNetworkFailure(error)
    }

    private static func isRetryableNetworkFailure(_ error: Error) -> Bool {
        let nsError = error as NSError

        if nsError.domain == NSURLErrorDomain, retryableURLCodes.contains(nsError.code) {
            return true
        }

        if nsError.domain == NSPOSIXErrorDomain, retryablePOSIXCodes.contains(nsError.code) {
            return true
        }

        if let streamCode = nsError.userInfo["_kCFStreamErrorCodeKey"] as? Int,
           retryablePOSIXCodes.contains(streamCode) {
            return true
        }

        if let underlying = nsError.userInfo[NSUnderlyingErrorKey] as? NSError {
            if underlying.domain == NSURLErrorDomain, retryableURLCodes.contains(underlying.code) {
                return true
            }
            if underlying.domain == NSPOSIXErrorDomain, retryablePOSIXCodes.contains(underlying.code) {
                return true
            }
        }

        return false
    }
}

// MARK: - Challenge

let nseAuthProtocolVersion = 1
let nseAuthSignatureContext = "quiet/qss-nse-auth/device-proof"
let nseAuthMaximumLifetimeMs: Int64 = 30_000
let nseAuthClockSkewMs: Int64 = 5_000
let nseAuthMaximumSafeInteger: Int64 = 9_007_199_254_740_991

struct ChallengePayload: Decodable {
    let protocolVersion: Int
    let type: String
    let deviceId: String
    let teamId: String
    let qssServerId: String
    let challengeId: String
    let nonce: String
    let issuedAtMs: Int64
    let expiresAtMs: Int64

    private enum CodingKeys: String, CodingKey, CaseIterable {
        case protocolVersion, type, deviceId, teamId, qssServerId, challengeId, nonce, issuedAtMs, expiresAtMs
    }

    init(from decoder: Decoder) throws {
        let dynamic = try decoder.container(keyedBy: AnyCodingKey.self)
        let expected = Set(CodingKeys.allCases.map(\.rawValue))
        let actual = Set(dynamic.allKeys.map(\.stringValue))
        guard actual == expected else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Challenge schema was not exact"))
        }
        let values = try decoder.container(keyedBy: CodingKeys.self)
        protocolVersion = try values.decode(Int.self, forKey: .protocolVersion)
        type = try values.decode(String.self, forKey: .type)
        deviceId = try values.decode(String.self, forKey: .deviceId)
        teamId = try values.decode(String.self, forKey: .teamId)
        qssServerId = try values.decode(String.self, forKey: .qssServerId)
        challengeId = try values.decode(String.self, forKey: .challengeId)
        nonce = try values.decode(String.self, forKey: .nonce)
        issuedAtMs = try values.decode(Int64.self, forKey: .issuedAtMs)
        expiresAtMs = try values.decode(Int64.self, forKey: .expiresAtMs)
        try Self.requireIntegerLiterals(decoder: decoder, keys: [.issuedAtMs, .expiresAtMs])
    }

    /// Rejects timestamps that were not integer JSON literals.
    ///
    /// `JSONDecoder` accepts any number whose `Double` value is integral when decoding
    /// `Int64`, so `1700000000000.0001` (below `Double` precision), `1e12` and
    /// `1700000000000.0` all decode as plain integers, while the server and the Android
    /// client only accept an integer literal. `Decimal` does not help: on iOS 17 Foundation
    /// builds it from a `Double`, and it accepts exponent forms. So look at the token itself.
    /// `JSONSerialization` keeps the integer/floating-point distinction of the literal in the
    /// `NSNumber` it produces, and the raw response bytes reach this initializer through the
    /// decoder's `userInfo` (see `NSEJSON.decode`). Decoding without the raw bytes fails closed.
    private static func requireIntegerLiterals(decoder: Decoder, keys: [CodingKeys]) throws {
        func corrupted(_ message: String) -> DecodingError {
            DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: message))
        }
        guard let raw = decoder.userInfo[NSEJSON.rawDataKey] as? Data else {
            throw corrupted("Challenge was decoded without its raw JSON")
        }
        var node = try JSONSerialization.jsonObject(with: raw)
        for key in decoder.codingPath {
            if let index = key.intValue, let array = node as? [Any], array.indices.contains(index) {
                node = array[index]
            } else if let object = node as? [String: Any], let child = object[key.stringValue] {
                node = child
            } else {
                throw corrupted("Challenge path was not found in the raw JSON")
            }
        }
        guard let object = node as? [String: Any] else {
            throw corrupted("Challenge was not a JSON object in the raw JSON")
        }
        for key in keys {
            guard let number = object[key.rawValue] as? NSNumber,
                  CFGetTypeID(number) != CFBooleanGetTypeID(),
                  !CFNumberIsFloatType(number) else {
                throw corrupted("\(key.rawValue) was not an integer JSON literal")
            }
        }
    }

    func validate(deviceId expectedDeviceId: String, teamId expectedTeamId: String, qssServerId expectedServerId: String, nowMs: Int64 = Int64(Date().timeIntervalSince1970 * 1000)) throws {
        guard protocolVersion == nseAuthProtocolVersion,
              type == "DEVICE",
              deviceId == expectedDeviceId,
              teamId == expectedTeamId,
              qssServerId == expectedServerId,
              challengeId.range(of: "^[0-9a-f]{32}$", options: .regularExpression) != nil,
              issuedAtMs >= 0,
              issuedAtMs <= nseAuthMaximumSafeInteger,
              expiresAtMs >= 0,
              expiresAtMs <= nseAuthMaximumSafeInteger,
              nowMs >= 0,
              nowMs <= nseAuthMaximumSafeInteger,
              expiresAtMs > issuedAtMs,
              expiresAtMs <= issuedAtMs + nseAuthMaximumLifetimeMs,
              issuedAtMs <= nowMs + nseAuthClockSkewMs,
              expiresAtMs + nseAuthClockSkewMs >= nowMs,
              let nonceBytes = Base58.decode(nonce),
              nonceBytes.count == 32,
              Base58.encode(nonceBytes) == nonce else {
            throw NSEAuthError.invalidResponse
        }
    }
}

private struct AnyCodingKey: CodingKey {
    let stringValue: String
    let intValue: Int? = nil
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { return nil }
}

struct ChallengeResponse: Decodable {
    let challengeId: String
    let challenge: ChallengePayload

    private enum CodingKeys: String, CodingKey, CaseIterable { case challengeId, challenge }

    init(from decoder: Decoder) throws {
        let dynamic = try decoder.container(keyedBy: AnyCodingKey.self)
        guard Set(dynamic.allKeys.map(\.stringValue)) == Set(CodingKeys.allCases.map(\.rawValue)) else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Challenge response schema was not exact"))
        }
        let values = try decoder.container(keyedBy: CodingKeys.self)
        challengeId = try values.decode(String.self, forKey: .challengeId)
        challenge = try values.decode(ChallengePayload.self, forKey: .challenge)
    }
}

// MARK: - Token

struct ProofPayload: Codable {
    let signature: String
}

struct TokenRequest: Codable {
    let challengeId: String
    let deviceId: String
    let signature: String
}

struct TokenResponse: Codable {
    let token: String
    let expiresIn: Int
}

// MARK: - Log Entries

// Matches QSS LogSyncEntry from LogEntrySyncStorageService
struct LogEntry: Decodable {
    let cid: String           // OrbitDB entry hash/CID
    let hashedDbId: String    // Hashed OrbitDB log ID
    let communityId: String   // Team ID
    let entry: Data           // Raw EncryptedAndSignedPayload bytes
    let receivedAt: String    // ISO 8601 UTC string
    let syncSeq: Int64        // Server-assigned per-team sync order

    private enum CodingKeys: String, CodingKey {
        case cid, hashedDbId, communityId, entry, receivedAt, syncSeq
    }

    // Node.js Buffer serializes to JSON as {"type":"Buffer","data":[byte,...]}
    private struct NodeBuffer: Decodable {
        let data: [UInt8]
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        cid = try c.decode(String.self, forKey: .cid)
        hashedDbId = try c.decode(String.self, forKey: .hashedDbId)
        communityId = try c.decode(String.self, forKey: .communityId)
        receivedAt = try c.decode(String.self, forKey: .receivedAt)
        syncSeq = try c.decode(Int64.self, forKey: .syncSeq)
        let buffer = try c.decode(NodeBuffer.self, forKey: .entry)
        entry = Data(buffer.data)
    }
}

struct LogEntriesResponse: Decodable {
    let entries: [LogEntry]
    let resolvedAfterSeq: Int64
}
