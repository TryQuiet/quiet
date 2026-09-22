import CryptoKit
import Foundation
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
        return try NSEJSON.decode(ChallengePayload.self, from: JSONSerialization.data(withJSONObject: value))
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
        XCTAssertEqual(secretKey.count, 64)
        let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: secretKey.suffix(32))

        // The fixture signature was produced by libsodium (deterministic Ed25519) on the other
        // platforms. CryptoKit randomizes Ed25519 signatures, so the bytes differ on every run
        // while still verifying under the same key. Check both directions of interop instead of
        // comparing signature bytes.
        let fixtureSignature = try XCTUnwrap(Base58.decode(
            "62XsfcCvq4SeRxmVK6LNyjuPpLyUSaCxPD315LRtfet9GnHQ6zu5sg8muz1eh4ZvvnZ6m3SH88KRztu4gm8W5YQk"
        ))
        XCTAssertTrue(publicKey.isValidSignature(fixtureSignature, for: expectedBytes))

        let iosSignature = try XCTUnwrap(Base58.decode(try NSEAuthProof.sign(value, privateKeyData: secretKey)))
        XCTAssertEqual(iosSignature.count, 64)
        XCTAssertTrue(publicKey.isValidSignature(iosSignature, for: expectedBytes))
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

        // Only an integer literal is acceptable for an integer field, matching the server and
        // Android. Every one of these decodes as an integral value through JSONDecoder alone.
        func document(issuedAtMs: String = "1700000000000", protocolVersion: String = "1", extraMembers: String = "") -> Data {
            """
            {"protocolVersion":\(protocolVersion),"type":"DEVICE","deviceId":"device-test-1","teamId":"team-test-1","qssServerId":"qss-test-1","challengeId":"00112233445566778899aabbccddeeff","nonce":"11111111111111111111111111111111","issuedAtMs":\(issuedAtMs)\(extraMembers),"expiresAtMs":1700000030000}
            """.data(using: .utf8)!
        }
        XCTAssertNoThrow(try NSEJSON.decode(ChallengePayload.self, from: document()))
        for bad in ["1700000000000.0001", "1700000000000.0", "1700000000000.5", "1.7e12", "1E12", "true"] {
            XCTAssertThrowsError(try NSEJSON.decode(ChallengePayload.self, from: document(issuedAtMs: bad)), bad)
        }
        for bad in ["1e0", "1.0"] {
            XCTAssertThrowsError(try NSEJSON.decode(ChallengePayload.self, from: document(protocolVersion: bad)), bad)
        }

        // Duplicate members make JSONDecoder and any second parser see different values, so
        // the whole document must be free of them, including escape-equivalent names.
        XCTAssertThrowsError(try NSEJSON.decode(
            ChallengePayload.self, from: document(issuedAtMs: "1.7e12", extraMembers: #","issuedAtMs":1700000000000"#)
        ))
        XCTAssertThrowsError(try NSEJSON.decode(
            ChallengePayload.self, from: document(extraMembers: #","issuedAtMs":1700000000000"#)
        ))
        XCTAssertThrowsError(try NSEJSON.decode(
            ChallengePayload.self, from: document(extraMembers: #","type":"DEVICE""#)
        ))
        let duplicateChallenge = """
        {"challengeId":"00112233445566778899aabbccddeeff","challenge":{"protocolVersion":1,"type":"DEVICE","deviceId":"device-test-1","teamId":"team-test-1","qssServerId":"qss-test-1","challengeId":"00112233445566778899aabbccddeeff","nonce":"11111111111111111111111111111111","issuedAtMs":1.7e12,"expiresAtMs":1700000030000},"challenge":{"protocolVersion":1,"type":"DEVICE","deviceId":"device-test-1","teamId":"team-test-1","qssServerId":"qss-test-1","challengeId":"00112233445566778899aabbccddeeff","nonce":"11111111111111111111111111111111","issuedAtMs":1700000000000,"expiresAtMs":1700000030000}}
        """.data(using: .utf8)!
        XCTAssertThrowsError(try NSEJSON.decode(ChallengeResponse.self, from: duplicateChallenge))

        // The literal check needs the raw bytes; decoding without them must fail closed.
        XCTAssertThrowsError(try JSONDecoder().decode(ChallengePayload.self, from: document()))
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
        let server = try FixedQSSHTTPServer(
            challenge: challenge(),
            signingPrivateKey: secretKey,
            encryptedEntry: Self.encryptedLogEntry
        )
        FixedQSSURLProtocol.server = server
        defer { FixedQSSURLProtocol.server = nil }

        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [FixedQSSURLProtocol.self]
        let session = URLSession(configuration: configuration)
        defer { session.invalidateAndCancel() }
        let client = NSENetworkClient(
            baseURL: URL(string: "https://fixed-qss.test")!,
            session: session
        )
        let credentials = RecordingCredentials(privateKeyData: secretKey)
        let crypto = NSECryptoService(lfaKeyReader: FixedLFAKeyReader())
        let service = NSEAuthService(
            client: client,
            crypto: crypto,
            credentials: credentials,
            nowMs: { self.now }
        )

        let orchestrator = NSEBackgroundNotificationOrchestrator()
        var badge = 7
        var cursor: Int64 = 40
        var delivery: NSEBackgroundNotificationDelivery?
        var events: [String] = []

        // NotificationService.fetchAndUpdate delegates this entire transaction
        // to the same production core: HTTP auth/fetch, cursor filter/sort,
        // decryption/presentation, content delivery, then cursor persistence.
        try await orchestrator.run(
            teamId: "team-test-1",
            baselineSeq: cursor,
            localUserId: "self-id",
            crypto: crypto,
            fetch: {
                try await service.fetchNewEntries(
                    teamId: "team-test-1",
                    qssServerId: "qss-test-1",
                    afterSeq: cursor
                )
            },
            channelName: { channelId in
                XCTAssertEqual(channelId, "channel-security")
                return "security"
            },
            authenticatedAuthor: { userId in
                XCTAssertEqual(userId, "user-alice")
                return "Alice"
            },
            storedBadge: { badge },
            saveBadge: {
                badge = $0
                events.append("badge:\($0)")
            },
            recordMissingNotificationKeyFailure: { _, _ in 1 },
            clearMissingNotificationKeyFailure: { _, _ in },
            stageCursor: { events.append("stage:\($0)") },
            deliver: {
                delivery = $0
                events.append("deliver")
                return true
            },
            persistCursor: {
                cursor = $0
                events.append("persist:\($0)")
            }
        )

        XCTAssertEqual(credentials.deviceIdReads, 1)
        XCTAssertEqual(credentials.privateKeyReads, 1)
        XCTAssertEqual(credentials.privateKeyDeviceIds, ["device-test-1"])
        XCTAssertTrue(server.verifiedProductionSignature)
        XCTAssertEqual(server.requestPaths, [
            "/nse-auth/challenge",
            "/nse-auth/token",
            "/nse-auth/logs/team-test-1?afterSeq=40"
        ])
        XCTAssertEqual(events, ["stage:42", "deliver", "badge:9", "persist:42"])
        XCTAssertEqual(badge, 9)
        XCTAssertEqual(cursor, 42)

        let delivered = try XCTUnwrap(delivery)
        // QSS deliberately returned seq 42, already-seen 40, then 41. The core
        // filters 40 and sorts the two unseen notifications before delivery.
        XCTAssertEqual(
            delivered.notifications.map(\.identifier),
            ["quiet.nse.synced.cid-fixed-41", "quiet.nse.synced.cid-fixed-42"]
        )
        XCTAssertEqual(delivered.badge, 9)
        XCTAssertEqual(delivered.notifications.map(\.badge), [8, 9])
        for notification in delivered.notifications {
            XCTAssertEqual(
                notification.presentation,
                NSEPreparedNotificationPresentation(
                    title: "Alice in #security",
                    body: "Authenticated background message",
                    threadIdentifier: "channel-security"
                )
            )
        }
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
        return try NSEJSON.decode(
            ChallengeResponse.self,
            from: JSONSerialization.data(withJSONObject: response)
        )
    }

    /// Generated with msgpackr-compatible map encoding and libsodium using
    /// deterministic nonces. The channel plaintext is also signed under the
    /// `lf/auth/team-message` domain by FixedLFAKeyReader's USER key.
    private static let encryptedLogEntry = Data(hex:
        "de0001a9656e63727970746564de0002a8636f6e74656e7473c502afde0004a56e6f6e6365c41818191a1b1c1d1e1f20" +
        "2122232425262728292a2b2c2d2e2fa3746167c420cc9a8a8218fa61b8d67f13b2ae817ba1f4cdaedfb109d7d1849c5c" +
        "5d5f6e7356a76d657373616765c5024587d24cba934925fea903d5f892ffa66d7e3e195a8085ca79f34f2a643c6707e5" +
        "d944e954b6e282c87fe58ad4c7ff3085d4800d9df644197d1995cef4a97d47b814ec37d4236d46679dd8d0fdbee93511" +
        "e4bf1b9fe2b3d4929ed45eb918f769208dedb876acd4937898e1cf6c19d22cf72d0262f0be21438059e5ec345c11a3eb" +
        "5a7f9b000d0c15ccbd666d5566b91922fe90128d90c7275ed9e2822ec039be6c1d78d1e6290897acdc68457c1328a358" +
        "3ed57db5709cdbfc6f61a042ac8ac9351cdbbb0f2b8dcab65a14364836f683efebdc381a41498cb5b16675ee61021c81" +
        "78d12faac458f3b4cdf72d6164109ea8f0d52e1533dae23d84f6c5b763f74a463b028e52a578514465878c889ae5c0b1" +
        "2d6d7771741b172a30d3893d26f1c038a357223e0f0ff434c969c0085401bfbea320563d04c09b11186f79c935194318" +
        "fa7637e715b874235d5d0a057ba5abe88219ed15134d79891fb136a61710eb27f48f35e4df44581a9adb83a2f95e8b72" +
        "8ca909f8c1d1c3d15ee3e7454b8704beb8d4ef4018969729e38a0e7655426f1c9dc70d7f408c7feecb3976f0f5fb911c" +
        "b33070a5d72a1deed763fbb86139eb02768a91d96ec38fac05e5cc47881b495d99a38abe04e8aa547b142af58516eb2e" +
        "a6ec1711257eea9016f86e1c979561572383cbdd313c725400ee9146ab8f0256f586590da735d5a51ecf09e09181c870" +
        "e0cc2eec6e20dc72f050572874ab69efbfaa92dd48a6ae3eaeca2f628ac70c7647e735c945bd2a2cadc53240768fd22d" +
        "bf42f851ba1bb9eba3d04e67cb68ed992678b42694a36d6163c410ee678f528d2de9140cea3b6902410f0ba573636f70" +
        "65de0003a474797065a45445414da46e616d65a45445414daa67656e65726174696f6e00"
    )
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

private enum FixedQSSError: Error {
    case invalidRequest(String)
    case unexpectedKey(String)
}

private struct FixedLFAKeyReader: NSELFAKeyReading {
    func lfaKeyString(keyName: String) throws -> String {
        switch keyName {
        case "quiet_team-test-1_TEAM_TEAM_0_secret":
            return "0123456789abcdef0123456789abcdef"
        case "quiet_team-test-1_USER_user-alice_0_userSig":
            return "3ogUn1GNXoASaRbxPNeVJnVv5rG4EPBtmQmX61jVorUe"
        default:
            throw FixedQSSError.unexpectedKey(keyName)
        }
    }
}

/// A deterministic, protocol-backed QSS. Requests still pass through
/// URLSession and NSENetworkClient, including the production JSON codecs and
/// HTTP headers, while the test remains independent of an external listener.
private final class FixedQSSHTTPServer {
    private let challenge: ChallengePayload
    private let signingPublicKey: Curve25519.Signing.PublicKey
    private let encryptedEntry: Data
    private let lock = NSLock()
    private var recordedRequestPaths: [String] = []
    private var didVerifyProductionSignature = false

    init(
        challenge: ChallengePayload,
        signingPrivateKey: Data,
        encryptedEntry: Data
    ) throws {
        self.challenge = challenge
        let privateKey = try Curve25519.Signing.PrivateKey(
            rawRepresentation: signingPrivateKey.prefix(32)
        )
        self.signingPublicKey = privateKey.publicKey
        self.encryptedEntry = encryptedEntry
    }

    var requestPaths: [String] {
        self.lock.lock()
        defer { self.lock.unlock() }
        return self.recordedRequestPaths
    }

    var verifiedProductionSignature: Bool {
        self.lock.lock()
        defer { self.lock.unlock() }
        return self.didVerifyProductionSignature
    }

    func respond(to request: URLRequest) throws -> (status: Int, body: Data) {
        self.lock.lock()
        defer { self.lock.unlock() }

        guard let url = request.url else {
            throw FixedQSSError.invalidRequest("missing URL")
        }
        let pathAndQuery = url.path + (url.query.map { "?\($0)" } ?? "")
        self.recordedRequestPaths.append(pathAndQuery)

        switch (request.httpMethod, url.path) {
        case ("POST", "/nse-auth/challenge"):
            return (200, try self.challengeResponse(for: request))
        case ("POST", "/nse-auth/token"):
            return (200, try self.tokenResponse(for: request))
        case ("GET", "/nse-auth/logs/team-test-1"):
            return (200, try self.logResponse(for: request, url: url))
        default:
            throw FixedQSSError.invalidRequest("unexpected route \(pathAndQuery)")
        }
    }

    private func challengeResponse(for request: URLRequest) throws -> Data {
        let body = try self.jsonBody(request)
        guard Set(body.keys) == ["deviceId", "teamId"],
              body["deviceId"] as? String == challenge.deviceId,
              body["teamId"] as? String == challenge.teamId else {
            throw FixedQSSError.invalidRequest("challenge request schema or binding")
        }

        let payload: [String: Any] = [
            "protocolVersion": challenge.protocolVersion,
            "type": challenge.type,
            "deviceId": challenge.deviceId,
            "teamId": challenge.teamId,
            "qssServerId": challenge.qssServerId,
            "challengeId": challenge.challengeId,
            "nonce": challenge.nonce,
            "issuedAtMs": challenge.issuedAtMs,
            "expiresAtMs": challenge.expiresAtMs
        ]
        return try JSONSerialization.data(withJSONObject: [
            "challengeId": challenge.challengeId,
            "challenge": payload
        ])
    }

    private func tokenResponse(for request: URLRequest) throws -> Data {
        let body = try self.jsonBody(request)
        guard Set(body.keys) == ["challengeId", "deviceId", "signature"],
              body["challengeId"] as? String == challenge.challengeId,
              body["deviceId"] as? String == challenge.deviceId,
              let signatureString = body["signature"] as? String,
              let signature = Base58.decode(signatureString),
              signature.count == 64,
              Base58.encode(signature) == signatureString,
              self.signingPublicKey.isValidSignature(
                  signature,
                  for: try NSEAuthProof.encode(challenge)
              ) else {
            throw FixedQSSError.invalidRequest("token proof was not the canonical registered-device signature")
        }
        self.didVerifyProductionSignature = true
        return try JSONSerialization.data(withJSONObject: [
            "token": "fixed-qss-token",
            "expiresIn": 300
        ])
    }

    private func logResponse(for request: URLRequest, url: URL) throws -> Data {
        guard self.didVerifyProductionSignature,
              request.value(forHTTPHeaderField: "Authorization") == "Bearer fixed-qss-token",
              URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems == [
                  URLQueryItem(name: "afterSeq", value: "40")
              ] else {
            throw FixedQSSError.invalidRequest("log request was not authenticated or cursor-bound")
        }
        func entry(cid: String, syncSeq: Int) -> [String: Any] {
            [
                "cid": cid,
                "hashedDbId": "hashed-db-fixed",
                "communityId": challenge.teamId,
                "entry": ["type": "Buffer", "data": [UInt8](self.encryptedEntry)],
                "receivedAt": "2023-11-14T22:13:20.000Z",
                "syncSeq": syncSeq
            ]
        }
        return try JSONSerialization.data(withJSONObject: [
            "entries": [
                entry(cid: "cid-fixed-42", syncSeq: 42),
                entry(cid: "cid-already-seen-40", syncSeq: 40),
                entry(cid: "cid-fixed-41", syncSeq: 41)
            ],
            "resolvedAfterSeq": 40
        ])
    }

    private func jsonBody(_ request: URLRequest) throws -> [String: Any] {
        guard request.value(forHTTPHeaderField: "Content-Type") == "application/json",
              let data = Self.body(of: request),
              let body = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw FixedQSSError.invalidRequest("request did not contain a JSON body")
        }
        return body
    }

    /// URLSession hands a URLProtocol the request body as `httpBodyStream`, never as
    /// `httpBody`, so read whichever one is present.
    private static func body(of request: URLRequest) -> Data? {
        if let data = request.httpBody { return data }
        guard let stream = request.httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: buffer.count)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data
    }
}

private final class FixedQSSURLProtocol: URLProtocol {
    static var server: FixedQSSHTTPServer?

    override class func canInit(with request: URLRequest) -> Bool {
        request.url?.host == "fixed-qss.test"
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        do {
            guard let server = Self.server, let url = request.url else {
                throw FixedQSSError.invalidRequest("fixed QSS was not configured")
            }
            let result = try server.respond(to: request)
            guard let response = HTTPURLResponse(
                url: url,
                statusCode: result.status,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            ) else {
                throw FixedQSSError.invalidRequest("could not construct HTTP response")
            }
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: result.body)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
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
    var signCalls = 0

    func signNseAuthProof(_ challenge: ChallengePayload, privateKeyData: Data) throws -> String {
        signCalls += 1
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
