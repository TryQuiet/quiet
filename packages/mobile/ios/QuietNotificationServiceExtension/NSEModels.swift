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

    private enum CodingKeys: String, CodingKey {
        case cid, hashedDbId, communityId, entry, receivedAt
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
        let buffer = try c.decode(NodeBuffer.self, forKey: .entry)
        entry = Data(buffer.data)
    }
}

struct LogEntriesResponse: Decodable {
    let entries: [LogEntry]
}
