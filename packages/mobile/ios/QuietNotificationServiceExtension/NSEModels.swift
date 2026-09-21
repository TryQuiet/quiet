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

// MARK: - Strict JSON token scan

/// Reports what `JSONDecoder` cannot: duplicate member names and the exact text of number
/// tokens. `JSONDecoder` keeps the first of two duplicate members and `JSONSerialization`
/// keeps the last, so a check that re-parses a document with a second parser must first
/// establish that the document has no duplicates at all; otherwise the two parsers can be
/// looking at different values. Member names are compared after unescaping, so
/// `"issuedAtMs"` and `"issuedAtMs"` count as the same name, as they do for `JSONDecoder`.
indirect enum NSEJSONToken {
    case object([String: NSEJSONToken])
    case array([NSEJSONToken])
    case string(String)
    case number(String)
    case literal(String)

    struct ScanError: Error, CustomStringConvertible {
        let description: String
    }

    static let maximumDepth = 32

    static func scan(_ data: Data) throws -> NSEJSONToken {
        var cursor = Cursor(bytes: [UInt8](data))
        cursor.skipWhitespace()
        let value = try cursor.value(depth: 0)
        cursor.skipWhitespace()
        guard cursor.atEnd else { throw ScanError(description: "trailing characters after JSON value") }
        return value
    }

    /// True for an integer literal as the server and the Android client emit and accept them.
    static func isIntegerLiteral(_ text: String) -> Bool {
        text.range(of: "^-?(0|[1-9][0-9]*)$", options: .regularExpression) != nil
    }

    private struct Cursor {
        let bytes: [UInt8]
        var index = 0

        init(bytes: [UInt8]) { self.bytes = bytes }

        var atEnd: Bool { index >= bytes.count }
        var current: UInt8? { atEnd ? nil : bytes[index] }

        mutating func skipWhitespace() {
            while let c = current, c == 0x20 || c == 0x09 || c == 0x0A || c == 0x0D { index += 1 }
        }

        mutating func expect(_ byte: UInt8) throws {
            guard current == byte else {
                throw ScanError(description: "expected '\(UnicodeScalar(byte))' at byte \(index)")
            }
            index += 1
        }

        mutating func value(depth: Int) throws -> NSEJSONToken {
            guard depth <= NSEJSONToken.maximumDepth else { throw ScanError(description: "JSON nested too deeply") }
            guard let c = current else { throw ScanError(description: "unexpected end of JSON") }
            switch c {
            case UInt8(ascii: "{"): return try object(depth: depth)
            case UInt8(ascii: "["): return try array(depth: depth)
            case UInt8(ascii: "\""): return .string(try string())
            case UInt8(ascii: "-"), UInt8(ascii: "0")...UInt8(ascii: "9"): return .number(try number())
            default: return .literal(try literal())
            }
        }

        mutating func object(depth: Int) throws -> NSEJSONToken {
            try expect(UInt8(ascii: "{"))
            var members: [String: NSEJSONToken] = [:]
            skipWhitespace()
            if current == UInt8(ascii: "}") { index += 1; return .object(members) }
            while true {
                skipWhitespace()
                let name = try string()
                skipWhitespace()
                try expect(UInt8(ascii: ":"))
                skipWhitespace()
                let member = try value(depth: depth + 1)
                guard members.updateValue(member, forKey: name) == nil else {
                    throw ScanError(description: "duplicate member \"\(name)\"")
                }
                skipWhitespace()
                if current == UInt8(ascii: ",") { index += 1; continue }
                try expect(UInt8(ascii: "}"))
                return .object(members)
            }
        }

        mutating func array(depth: Int) throws -> NSEJSONToken {
            try expect(UInt8(ascii: "["))
            var items: [NSEJSONToken] = []
            skipWhitespace()
            if current == UInt8(ascii: "]") { index += 1; return .array(items) }
            while true {
                skipWhitespace()
                items.append(try value(depth: depth + 1))
                skipWhitespace()
                if current == UInt8(ascii: ",") { index += 1; continue }
                try expect(UInt8(ascii: "]"))
                return .array(items)
            }
        }

        mutating func string() throws -> String {
            try expect(UInt8(ascii: "\""))
            var result = String.UnicodeScalarView()
            var pending: [UInt8] = []
            func flush() throws {
                guard !pending.isEmpty else { return }
                guard let text = String(bytes: pending, encoding: .utf8) else {
                    throw ScanError(description: "invalid UTF-8 in string")
                }
                result.append(contentsOf: text.unicodeScalars)
                pending.removeAll(keepingCapacity: true)
            }
            while true {
                guard let c = current else { throw ScanError(description: "unterminated string") }
                index += 1
                switch c {
                case UInt8(ascii: "\""):
                    try flush()
                    return String(result)
                case UInt8(ascii: "\\"):
                    try flush()
                    guard let e = current else { throw ScanError(description: "unterminated escape") }
                    index += 1
                    switch e {
                    case UInt8(ascii: "\""): result.append("\"")
                    case UInt8(ascii: "\\"): result.append("\\")
                    case UInt8(ascii: "/"): result.append("/")
                    case UInt8(ascii: "b"): result.append("\u{08}")
                    case UInt8(ascii: "f"): result.append("\u{0C}")
                    case UInt8(ascii: "n"): result.append("\n")
                    case UInt8(ascii: "r"): result.append("\r")
                    case UInt8(ascii: "t"): result.append("\t")
                    case UInt8(ascii: "u"):
                        var unit = try hex4()
                        if (0xD800...0xDBFF).contains(unit) {
                            guard current == UInt8(ascii: "\\") else { throw ScanError(description: "lone high surrogate") }
                            index += 1
                            guard current == UInt8(ascii: "u") else { throw ScanError(description: "lone high surrogate") }
                            index += 1
                            let low = try hex4()
                            guard (0xDC00...0xDFFF).contains(low) else { throw ScanError(description: "invalid low surrogate") }
                            unit = 0x10000 + ((unit - 0xD800) << 10) + (low - 0xDC00)
                        } else if (0xDC00...0xDFFF).contains(unit) {
                            throw ScanError(description: "lone low surrogate")
                        }
                        guard let scalar = UnicodeScalar(unit) else { throw ScanError(description: "invalid unicode escape") }
                        result.append(scalar)
                    default:
                        throw ScanError(description: "invalid escape")
                    }
                case 0x00...0x1F:
                    throw ScanError(description: "control character in string")
                default:
                    pending.append(c)
                }
            }
        }

        mutating func hex4() throws -> UInt32 {
            guard index + 4 <= bytes.count else { throw ScanError(description: "short unicode escape") }
            var value: UInt32 = 0
            for _ in 0..<4 {
                let c = bytes[index]
                index += 1
                let digit: UInt32
                switch c {
                case UInt8(ascii: "0")...UInt8(ascii: "9"): digit = UInt32(c - UInt8(ascii: "0"))
                case UInt8(ascii: "a")...UInt8(ascii: "f"): digit = UInt32(c - UInt8(ascii: "a") + 10)
                case UInt8(ascii: "A")...UInt8(ascii: "F"): digit = UInt32(c - UInt8(ascii: "A") + 10)
                default: throw ScanError(description: "invalid hex digit in unicode escape")
                }
                value = value * 16 + digit
            }
            return value
        }

        mutating func number() throws -> String {
            let start = index
            if current == UInt8(ascii: "-") { index += 1 }
            guard let first = current, (UInt8(ascii: "0")...UInt8(ascii: "9")).contains(first) else {
                throw ScanError(description: "invalid number")
            }
            if first == UInt8(ascii: "0") { index += 1 } else { digits() }
            if current == UInt8(ascii: ".") { index += 1; try requireDigits() }
            if current == UInt8(ascii: "e") || current == UInt8(ascii: "E") {
                index += 1
                if current == UInt8(ascii: "+") || current == UInt8(ascii: "-") { index += 1 }
                try requireDigits()
            }
            return String(decoding: bytes[start..<index], as: UTF8.self)
        }

        mutating func digits() {
            while let c = current, (UInt8(ascii: "0")...UInt8(ascii: "9")).contains(c) { index += 1 }
        }

        mutating func requireDigits() throws {
            let start = index
            digits()
            guard index > start else { throw ScanError(description: "invalid number") }
        }

        mutating func literal() throws -> String {
            for word in ["true", "false", "null"] {
                let expected = Array(word.utf8)
                if index + expected.count <= bytes.count, Array(bytes[index..<index + expected.count]) == expected {
                    index += expected.count
                    return word
                }
            }
            throw ScanError(description: "unexpected token at byte \(index)")
        }
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
        try Self.requireIntegerLiterals(decoder: decoder, keys: [.protocolVersion, .issuedAtMs, .expiresAtMs])
    }

    /// Rejects integers that were not integer JSON literals.
    ///
    /// `JSONDecoder` accepts any number whose `Double` value is integral when decoding an
    /// integer type, so `1700000000000.0001` (below `Double` precision), `1e12`, `1.0` and
    /// `1700000000000.0` all decode as plain integers, while the server and the Android client
    /// only accept an integer literal. `Decimal` does not help: on iOS 17 Foundation builds it
    /// from a `Double`, and it accepts exponent forms. So look at the token itself: the raw
    /// response bytes reach this initializer through the decoder's `userInfo` (see
    /// `NSEJSON.decode`), a strict scan of the whole document rejects duplicate member names
    /// anywhere (which is what guarantees the walk below lands on the object `JSONDecoder`
    /// decoded), and the number tokens must be integer literals. Decoding without the raw bytes
    /// fails closed.
    private static func requireIntegerLiterals(decoder: Decoder, keys: [CodingKeys]) throws {
        func corrupted(_ message: String) -> DecodingError {
            DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: message))
        }
        guard let raw = decoder.userInfo[NSEJSON.rawDataKey] as? Data else {
            throw corrupted("Challenge was decoded without its raw JSON")
        }
        var node: NSEJSONToken
        do {
            node = try NSEJSONToken.scan(raw)
        } catch {
            throw corrupted("Challenge JSON was not strict: \(error)")
        }
        for key in decoder.codingPath {
            switch (node, key.intValue) {
            case (.array(let items), let index?) where items.indices.contains(index):
                node = items[index]
            case (.object(let members), nil):
                guard let child = members[key.stringValue] else {
                    throw corrupted("Challenge path was not found in the raw JSON")
                }
                node = child
            default:
                throw corrupted("Challenge path was not found in the raw JSON")
            }
        }
        guard case .object(let members) = node else {
            throw corrupted("Challenge was not a JSON object in the raw JSON")
        }
        for key in keys {
            guard case .number(let text)? = members[key.rawValue], NSEJSONToken.isIntegerLiteral(text) else {
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
