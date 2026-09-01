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
}

private extension Data {
    init(hex: String) {
        self.init(stride(from: 0, to: hex.count, by: 2).map { index in
            UInt8(hex[hex.index(hex.startIndex, offsetBy: index)..<hex.index(hex.startIndex, offsetBy: index + 2)], radix: 16)!
        })
    }
}
