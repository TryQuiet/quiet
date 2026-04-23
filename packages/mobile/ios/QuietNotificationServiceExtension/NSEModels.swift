import Foundation

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

struct ChallengePayload: Codable {
    let type: String
    let name: String
    let nonce: String
    let timestamp: Int64  // Unix ms, from identity.challenge() in TypeScript
}

struct ChallengeResponse: Codable {
    let challengeId: String
    let challenge: ChallengePayload
}

// MARK: - Token

struct ProofPayload: Codable {
    let signature: String
    let publicKey: String
}

struct TokenRequest: Codable {
    let challengeId: String
    let deviceId: String
    let proof: ProofPayload
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
