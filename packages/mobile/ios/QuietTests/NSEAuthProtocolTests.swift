import XCTest

final class NSEAuthProtocolTests: XCTestCase {
    private let now: Int64 = 1_700_000_000_000

    private func challenge(overrides: [String: Any] = [:], extra: [String: Any] = [:]) throws -> ChallengePayload {
        var value: [String: Any] = [
            "protocolVersion": 1,
            "type": "DEVICE",
            "deviceId": "device-test-1",
            "teamId": "team-test-1",
            "qssServerId": "qss-test-1",
            "challengeId": "00112233445566778899aabbccddeeff",
            "nonce": "11111111111111111111111111111111",
            "issuedAtMs": now,
            "expiresAtMs": now + 30_000
        ]
        overrides.forEach { value[$0.key] = $0.value }
        extra.forEach { value[$0.key] = $0.value }
        return try JSONDecoder().decode(ChallengePayload.self, from: JSONSerialization.data(withJSONObject: value))
    }

    func testCanonicalBytesAndSignatureMatchCrossPlatformFixture() throws {
        let value = try challenge()
        let expectedBytes = Data(hex:
            "92bf71756965742f7173732d6e73652d617574682f6465766963652d70726f6f66" +
            "9901a6444556494345ad6465766963652d746573742d31ab7465616d2d746573742d31" +
            "aa7173732d746573742d31d920303031313232333334343535363637373838393961616262" +
            "6363646465656666d920313131313131313131313131313131313131313131313131313131" +
            "3131313131cb4278bcfe56800000cb4278bcfe5dd30000")
        XCTAssertEqual(try NSEAuthProof.encode(value), expectedBytes)

        let secretKey = try XCTUnwrap(Base58.decode("2ZC6948FLMTyZ9cAN2Db6u4E9FN72vEwXa1s193vMozZUYnBzVU7952gS6zY7T2VZJVBuJKSsdo7gDDkox3tZx4u"))
        XCTAssertEqual(
            try NSEAuthProof.sign(value, privateKeyData: secretKey),
            "62XsfcCvq4SeRxmVK6LNyjuPpLyUSaCxPD315LRtfet9GnHQ6zu5sg8muz1eh4ZvvnZ6m3SH88KRztu4gm8W5YQk"
        )
    }

    func testValidationRejectsIdentityProtocolNonceAndTimestampAttacks() throws {
        try challenge().validate(deviceId: "device-test-1", teamId: "team-test-1", qssServerId: "qss-test-1", nowMs: now)
        let invalid: [[String: Any]] = [
            ["protocolVersion": 2], ["type": "USER"], ["qssServerId": "qss-test-2"],
            ["nonce": "0"], ["nonce": String(repeating: "1", count: 31)],
            ["issuedAtMs": now + nseAuthClockSkewMs + 1],
            ["expiresAtMs": now - nseAuthClockSkewMs - 1],
            ["issuedAtMs": nseAuthMaximumSafeInteger + 1],
            ["expiresAtMs": nseAuthMaximumSafeInteger + 1],
            ["issuedAtMs": -1]
        ]
        for overrides in invalid {
            let candidate = try challenge(overrides: overrides)
            XCTAssertThrowsError(try candidate.validate(deviceId: "device-test-1", teamId: "team-test-1", qssServerId: "qss-test-1", nowMs: now))
        }
    }

    func testDecoderRejectsNonExactSchemaAndNumericStrings() throws {
        XCTAssertThrowsError(try challenge(extra: ["extra": true]))
        XCTAssertThrowsError(try challenge(overrides: ["issuedAtMs": "1700000000000"]))
        XCTAssertThrowsError(try challenge(overrides: ["type": 7]))
        let fractional = """
        {"protocolVersion":1,"type":"DEVICE","deviceId":"device-test-1","teamId":"team-test-1","qssServerId":"qss-test-1","challengeId":"00112233445566778899aabbccddeeff","nonce":"11111111111111111111111111111111","issuedAtMs":1700000000000.0001,"expiresAtMs":1700000030000}
        """.data(using: .utf8)!
        XCTAssertThrowsError(try JSONDecoder().decode(ChallengePayload.self, from: fractional))
    }

    func testAuthenticateRejectsEveryMaliciousChallengeBeforePrivateKeySigningOrTokenRequest() async throws {
        let attacks: [(String, [String: Any], String?)] = [
            ("protocol version", ["protocolVersion": 2], nil),
            ("proof type", ["type": "USER"], nil),
            ("device binding", ["deviceId": "device-attacker"], nil),
            ("team binding", ["teamId": "team-attacker"], nil),
            ("pinned QSS server binding", ["qssServerId": "qss-attacker"], nil),
            ("challenge id syntax", ["challengeId": "not-canonical"], nil),
            ("outer/inner challenge id binding", [:], "ffeeddccbbaa99887766554433221100"),
            ("nonce length", ["nonce": String(repeating: "1", count: 31)], nil),
            ("nonce canonical encoding", ["nonce": String(repeating: "0", count: 32)], nil),
            ("future issue time", ["issuedAtMs": now + nseAuthClockSkewMs + 1, "expiresAtMs": now + nseAuthClockSkewMs + 2], nil),
            ("expired window", ["issuedAtMs": now - 30_000, "expiresAtMs": now - nseAuthClockSkewMs - 1], nil),
            ("overlong window", ["expiresAtMs": now + nseAuthMaximumLifetimeMs + 1], nil)
        ]

        for (name, overrides, outerChallengeId) in attacks {
            let client = FixedQSSClient(
                challengeResponse: try challengeResponse(
                    overrides: overrides,
                    outerChallengeId: outerChallengeId
                )
            )
            let credentials = RecordingCredentials()
            let signer = RecordingSigner()
            let service = NSEAuthService(
                client: client,
                crypto: signer,
                credentials: credentials,
                nowMs: { self.now }
            )

            do {
                _ = try await service.authenticate(
                    deviceId: "device-test-1",
                    teamId: "team-test-1",
                    qssServerId: "qss-test-1"
                )
                XCTFail("Accepted malicious challenge: \(name)")
            } catch NSEAuthError.invalidResponse {
                // Every malicious response must fail closed before private-key access.
            } catch {
                XCTFail("Unexpected error for attack \(name): \(error)")
            }

            XCTAssertEqual(credentials.privateKeyReads, 0, "private key read for attack: \(name)")
            XCTAssertEqual(signer.signCalls, 0, "challenge signed for attack: \(name)")
            XCTAssertEqual(client.tokenRequests.count, 0, "token requested for attack: \(name)")
            XCTAssertEqual(client.challengeRequests.count, 1, "unexpected challenge request count for attack: \(name)")
        }
    }

    func testBackgroundNotificationAuthFetchAndRenderUsesProductionProofAndPinnedIdentity() async throws {
        let secretKey = try XCTUnwrap(Base58.decode(
            "2ZC6948FLMTyZ9cAN2Db6u4E9FN72vEwXa1s193vMozZUYnBzVU7952gS6zY7T2VZJVBuJKSsdo7gDDkox3tZx4u"
        ))
        let client = FixedQSSClient(
            challengeResponse: try challengeResponse(),
            tokenResponse: TokenResponse(token: "fixed-qss-token", expiresIn: 300),
            logResponse: try logEntriesResponse()
        )
        let credentials = RecordingCredentials(privateKeyData: secretKey)
        let signer = RecordingSigner(useProductionProof: true)
        let service = NSEAuthService(
            client: client,
            crypto: signer,
            credentials: credentials,
            nowMs: { self.now }
        )

        // This is the production NotificationService fetch path: credentials ->
        // challenge validation -> native proof -> token -> authenticated log fetch.
        let response = try await service.fetchNewEntries(
            teamId: "team-test-1",
            qssServerId: "qss-test-1",
            afterSeq: 40
        )

        XCTAssertEqual(credentials.deviceIdReads, 1)
        XCTAssertEqual(credentials.privateKeyReads, 1)
        XCTAssertEqual(credentials.privateKeyDeviceIds, ["device-test-1"])
        XCTAssertEqual(client.challengeRequests, [ChallengeRequest(deviceId: "device-test-1", teamId: "team-test-1")])
        XCTAssertEqual(signer.signCalls, 1)
        XCTAssertEqual(client.tokenRequests.count, 1)
        XCTAssertEqual(client.tokenRequests.first?.challengeId, "00112233445566778899aabbccddeeff")
        XCTAssertEqual(client.tokenRequests.first?.deviceId, "device-test-1")
        XCTAssertEqual(
            client.tokenRequests.first?.signature,
            "62XsfcCvq4SeRxmVK6LNyjuPpLyUSaCxPD315LRtfet9GnHQ6zu5sg8muz1eh4ZvvnZ6m3SH88KRztu4gm8W5YQk"
        )
        XCTAssertEqual(client.logRequests, [LogRequest(teamId: "team-test-1", afterSeq: 40, token: "fixed-qss-token")])
        XCTAssertEqual(response.entries.map(\.syncSeq), [41])
        XCTAssertEqual(response.entries.first?.entry, Data([1, 2, 3, 4]))

        // NotificationService applies this exact production presenter after its
        // crypto layer decrypts the returned entry.
        let presentation = NSENotificationPresenter.makePresentation(
            message: NSEDecryptedNotificationMessage(
                channelId: "channel-security",
                userId: "user-alice",
                body: "Authenticated background message",
                type: 1
            ),
            channelName: "security",
            authenticatedAuthor: "Alice"
        )
        XCTAssertEqual(
            presentation,
            NSEPreparedNotificationPresentation(
                title: "Alice in #security",
                body: "Authenticated background message",
                threadIdentifier: "channel-security"
            )
        )
    }

    private func challengeResponse(
        overrides: [String: Any] = [:],
        outerChallengeId: String? = nil
    ) throws -> ChallengeResponse {
        var payload: [String: Any] = [
            "protocolVersion": 1,
            "type": "DEVICE",
            "deviceId": "device-test-1",
            "teamId": "team-test-1",
            "qssServerId": "qss-test-1",
            "challengeId": "00112233445566778899aabbccddeeff",
            "nonce": "11111111111111111111111111111111",
            "issuedAtMs": now,
            "expiresAtMs": now + 30_000
        ]
        overrides.forEach { payload[$0.key] = $0.value }
        let response: [String: Any] = [
            "challengeId": outerChallengeId ?? (payload["challengeId"] as? String ?? "00112233445566778899aabbccddeeff"),
            "challenge": payload
        ]
        return try JSONDecoder().decode(
            ChallengeResponse.self,
            from: JSONSerialization.data(withJSONObject: response)
        )
    }

    private func logEntriesResponse() throws -> LogEntriesResponse {
        let value: [String: Any] = [
            "entries": [[
                "cid": "cid-fixed-41",
                "hashedDbId": "hashed-db-fixed",
                "communityId": "team-test-1",
                "entry": ["type": "Buffer", "data": [1, 2, 3, 4]],
                "receivedAt": "2023-11-14T22:13:20.000Z",
                "syncSeq": 41
            ]],
            "resolvedAfterSeq": 40
        ]
        return try JSONDecoder().decode(
            LogEntriesResponse.self,
            from: JSONSerialization.data(withJSONObject: value)
        )
    }
}

private struct ChallengeRequest: Equatable {
    let deviceId: String
    let teamId: String
}

private struct RecordedTokenRequest {
    let challengeId: String
    let deviceId: String
    let signature: String
}

private struct LogRequest: Equatable {
    let teamId: String
    let afterSeq: Int64
    let token: String
}

private final class FixedQSSClient: NSEAuthNetworking {
    let baseURL = URL(string: "https://fixed-qss.test")!
    let challengeResponse: ChallengeResponse
    let tokenResponse: TokenResponse
    let logResponse: LogEntriesResponse
    var challengeRequests: [ChallengeRequest] = []
    var tokenRequests: [RecordedTokenRequest] = []
    var logRequests: [LogRequest] = []

    init(
        challengeResponse: ChallengeResponse,
        tokenResponse: TokenResponse = TokenResponse(token: "unused", expiresIn: 300),
        logResponse: LogEntriesResponse? = nil
    ) {
        self.challengeResponse = challengeResponse
        self.tokenResponse = tokenResponse
        self.logResponse = logResponse ?? Self.emptyLogResponse()
    }

    func requestChallenge(deviceId: String, teamId: String) async throws -> ChallengeResponse {
        challengeRequests.append(ChallengeRequest(deviceId: deviceId, teamId: teamId))
        return challengeResponse
    }

    func requestToken(challengeId: String, deviceId: String, signature: String) async throws -> TokenResponse {
        tokenRequests.append(RecordedTokenRequest(
            challengeId: challengeId,
            deviceId: deviceId,
            signature: signature
        ))
        return tokenResponse
    }

    func fetchLogEntries(teamId: String, afterSeq: Int64, token: String) async throws -> LogEntriesResponse {
        logRequests.append(LogRequest(teamId: teamId, afterSeq: afterSeq, token: token))
        return logResponse
    }

    private static func emptyLogResponse() -> LogEntriesResponse {
        try! JSONDecoder().decode(
            LogEntriesResponse.self,
            from: #"{"entries":[],"resolvedAfterSeq":0}"#.data(using: .utf8)!
        )
    }
}

private final class RecordingCredentials: NSEDeviceCredentials {
    let privateKeyData: Data
    var deviceIdReads = 0
    var privateKeyReads = 0
    var privateKeyDeviceIds: [String] = []

    init(privateKeyData: Data = Data(repeating: 7, count: 32)) {
        self.privateKeyData = privateKeyData
    }

    func deviceId() throws -> String {
        deviceIdReads += 1
        return "device-test-1"
    }

    func privateKey(deviceId: String) throws -> Data {
        privateKeyReads += 1
        privateKeyDeviceIds.append(deviceId)
        return privateKeyData
    }
}

private final class RecordingSigner: NSEAuthSigning {
    let useProductionProof: Bool
    var signCalls = 0

    init(useProductionProof: Bool = false) {
        self.useProductionProof = useProductionProof
    }

    func signNseAuthProof(_ challenge: ChallengePayload, privateKeyData: Data) throws -> String {
        signCalls += 1
        if useProductionProof {
            return try NSEAuthProof.sign(challenge, privateKeyData: privateKeyData)
        }
        return "spy-signature"
    }
}

private extension Data {
    init(hex: String) {
        self.init(stride(from: 0, to: hex.count, by: 2).map { index in
            UInt8(hex[hex.index(hex.startIndex, offsetBy: index)..<hex.index(hex.startIndex, offsetBy: index + 2)], radix: 16)!
        })
    }
}
