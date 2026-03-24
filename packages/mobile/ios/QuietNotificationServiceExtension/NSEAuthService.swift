import Foundation

class NSEAuthService {
    private let client: NSENetworkClient
    private let crypto: DeviceCryptography

    private var tokenCache: [String: (token: String, expiry: Date)] = [:]

    init(client: NSENetworkClient, crypto: DeviceCryptography) {
        self.client = client
        self.crypto = crypto
    }

    // MARK: - Full auth flow

    func authenticate(deviceId: String, teamId: String) async throws -> String {
        if let cached = tokenCache[teamId], cached.expiry > Date() {
            return cached.token
        }

        let challengeResp = try await client.requestChallenge(deviceId: deviceId, teamId: teamId)

        // Sign the challenge using msgpack serialization (matching TypeScript identity.prove())
        let privateKeyData = try NSEKeychainHelper.getDevicePrivateKey(deviceId: deviceId)
        let proof = try crypto.signChallengePayload(challengeResp.challenge, privateKeyData: privateKeyData)

        let tokenResp = try await client.requestToken(
            challengeId: challengeResp.challengeId,
            deviceId: deviceId,
            proof: proof
        )

        tokenCache[teamId] = (token: tokenResp.token, expiry: Date().addingTimeInterval(TimeInterval(tokenResp.expiresIn) - 30))

        return tokenResp.token
    }

    // MARK: - Fetch log entries

    func fetchNewEntries(teamId: String, since: Int64) async throws -> [LogEntry] {
        let deviceId = try NSEKeychainHelper.getDeviceId()
        let token = try await authenticate(deviceId: deviceId, teamId: teamId)
        let resp = try await client.fetchLogEntries(teamId: teamId, since: since, token: token)
        return resp.entries
    }
}

// MARK: - Base58 encoder (Bitcoin alphabet)

enum Base58 {
    static let alphabet = Array("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

    static func encode(_ data: Data) -> String {
        let bytes = [UInt8](data)
        var leadingZeros = 0
        for b in bytes {
            if b == 0 { leadingZeros += 1 } else { break }
        }

        var result = [UInt8]()
        for byte in bytes {
            var carry = Int(byte)
            for i in 0..<result.count {
                carry += 256 * Int(result[i])
                result[i] = UInt8(carry % 58)
                carry /= 58
            }
            while carry > 0 {
                result.append(UInt8(carry % 58))
                carry /= 58
            }
        }

        let leading = String(repeating: "1", count: leadingZeros)
        let encoded = result.reversed().map { alphabet[Int($0)] }
        return leading + String(encoded)
    }

    static func decode(_ string: String) -> Data? {
        let alphabetMap: [Character: Int] = Dictionary(
            uniqueKeysWithValues: alphabet.enumerated().map { ($1, $0) }
        )

        var leadingZeros = 0
        for c in string {
            if c == "1" { leadingZeros += 1 } else { break }
        }

        var result = [UInt8]()
        for c in string {
            guard let digit = alphabetMap[c] else { return nil }
            var carry = digit
            for i in 0..<result.count {
                carry += 58 * Int(result[i])
                result[i] = UInt8(carry & 0xFF)
                carry >>= 8
            }
            while carry > 0 {
                result.append(UInt8(carry & 0xFF))
                carry >>= 8
            }
        }

        let leading = [UInt8](repeating: 0, count: leadingZeros)
        return Data(leading + result.reversed())
    }
}
