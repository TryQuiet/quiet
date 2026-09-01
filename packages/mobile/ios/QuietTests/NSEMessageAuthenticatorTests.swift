import CryptoKit
import XCTest

final class NSEMessageAuthenticatorTests: XCTestCase {
    private enum RetryableTestError: NSERetryableNotificationError {
        case missingKey

        var isRetryableForNotification: Bool { true }
    }
    private let privateKey = Curve25519.Signing.PrivateKey()
    private let plaintext = Data([0x81, 0xa2, 0x69, 0x64, 0xa1, 0x31])

    private func authenticate(
        plaintext: Data? = nil,
        signature: Data? = nil,
        publicKey: Data? = nil,
        authorName: String = "alice-id",
        envelopeChannelId: String? = "channel-id"
    ) throws {
        let bytes = plaintext ?? self.plaintext
        let validSignature = try privateKey.signature(for: NSEMessageAuthenticator.signaturePayload(self.plaintext))
        try NSEMessageAuthenticator.authenticate(
            plaintext: bytes,
            signature: signature ?? validSignature,
            publicKey: publicKey ?? privateKey.publicKey.rawRepresentation,
            authorType: "USER",
            authorName: authorName,
            messageUserId: "alice-id",
            messageId: "message-id",
            envelopeId: "message-id",
            messageTeamId: "team-id",
            envelopeTeamId: "team-id",
            requestedTeamId: "team-id",
            messageChannelId: "channel-id",
            envelopeChannelId: envelopeChannelId,
            messageCreatedAt: 1234,
            envelopeCreatedAt: 1234
        )
    }

    func testAcceptsValidAuthenticatedMessage() throws {
        XCTAssertNoThrow(try authenticate())
    }

    func testRejectsMissingOrMalformedSignature() throws {
        XCTAssertThrowsError(
            try NSEMessageAuthenticator.authenticate(
                plaintext: plaintext,
                signature: nil,
                publicKey: privateKey.publicKey.rawRepresentation,
                authorType: "USER",
                authorName: "alice-id",
                messageUserId: "alice-id",
                messageId: "message-id",
                envelopeId: "message-id",
                messageTeamId: "team-id",
                envelopeTeamId: "team-id",
                requestedTeamId: "team-id",
                messageChannelId: "channel-id",
                envelopeChannelId: "channel-id",
                messageCreatedAt: 1234,
                envelopeCreatedAt: 1234
            )
        )
        XCTAssertThrowsError(try authenticate(signature: Data([0x01])))
    }

    func testRejectsInvalidSignatureAndChangedContent() throws {
        XCTAssertThrowsError(try authenticate(signature: Data(repeating: 0, count: 64)))
        XCTAssertThrowsError(try authenticate(plaintext: plaintext + Data([0])))
    }

    func testRejectsAuthorAndImmutableFieldMismatch() throws {
        XCTAssertThrowsError(try authenticate(authorName: "mallory-id"))
        XCTAssertThrowsError(try authenticate(envelopeChannelId: "other-channel"))
    }

    func testMalformedGenerationIsRejectedBeforeLookupAndDoesNotBlockNextValidEntry() throws {
        let signature = try privateKey.signature(for: NSEMessageAuthenticator.signaturePayload(plaintext))
        var lookups = 0
        var cursor: Int64 = 10
        for (sequence, generationValue) in [(Int64(11), 3.5 as Any), (Int64(12), 3 as Any)] {
            do {
                guard NSEMessageAuthenticator.exactNonNegativeInt(generationValue) != nil else {
                    throw NSEMessageAuthenticationError.malformedSignature
                }
                _ = try NSEMessageAuthenticator.publicKeyAfterValidatingClaims(
                    signature: signature,
                    authorType: "USER",
                    authorName: "alice-id",
                    messageUserId: "alice-id",
                    messageId: "message-id",
                    envelopeId: "message-id",
                    messageTeamId: "team-id",
                    envelopeTeamId: "team-id",
                    requestedTeamId: "team-id",
                    messageChannelId: "channel-id",
                    envelopeChannelId: "channel-id",
                    messageCreatedAt: 1234,
                    envelopeCreatedAt: 1234,
                    lookup: {
                        lookups += 1
                        return self.privateKey.publicKey.rawRepresentation
                    }
                )
                cursor = NSENotificationCursorPolicy.cursor(after: cursor, processing: sequence, outcome: .delivered)
            } catch {
                let outcome: NSENotificationProcessingOutcome = NSENotificationFailurePolicy.isRetryable(error)
                    ? .deliveryFailed
                    : .rejected
                cursor = NSENotificationCursorPolicy.cursor(after: cursor, processing: sequence, outcome: outcome)
            }
        }

        XCTAssertEqual(cursor, 12)
        XCTAssertEqual(lookups, 1)
    }

    func testEncryptionScopeGenerationsUseExactNonNegativeParserBeforeLookup() {
        let malformed: [Any] = [3.5, -1, Int64.max, Double.nan, Double.infinity, "3", true]
        var lookups = 0

        for label in ["outer QSS payload", "inner channel message"] {
            for generation in malformed {
                let scope: [String: Any] = ["type": "ROLE", "name": "member", "generation": generation]
                guard NSEMessageAuthenticator.exactEncryptionScope(scope) != nil else {
                    continue
                }
                XCTFail("\(label) accepted malformed generation \(generation)")
                lookups += 1
            }
        }
        let validScope: [String: Any] = ["type": "ROLE", "name": "member", "generation": 3]
        if NSEMessageAuthenticator.exactEncryptionScope(validScope) != nil {
            lookups += 1
        }

        XCTAssertEqual(lookups, 1, "only an exact scope generation may reach an LFA key lookup")
    }

    func testPresentationIncludesAuthenticatedAuthorAndChannel() {
        XCTAssertEqual(
            NSENotificationPresentation.title(channelName: "general", authenticatedAuthor: "Alice"),
            "Alice in #general"
        )
    }

    func testRejectedEntryAdvancesCursorSoLaterEntriesAreNotBlocked() {
        let cursor = NSENotificationCursorPolicy.cursor(
            after: 10,
            processing: 11,
            outcome: .rejected
        )

        XCTAssertEqual(cursor, 11)
    }

    func testDeliveryFailureDoesNotAdvanceCursorPastUndeliveredEntry() {
        let cursor = NSENotificationCursorPolicy.cursor(
            after: 10,
            processing: 11,
            outcome: .deliveryFailed
        )

        XCTAssertEqual(cursor, 10)
    }

    func testMissingKeyFailureIsRetryableWithoutDependingOnCryptoServiceTarget() {
        XCTAssertTrue(NSENotificationFailurePolicy.isRetryable(RetryableTestError.missingKey))
        XCTAssertFalse(NSENotificationFailurePolicy.isRetryable(NSEMessageAuthenticationError.invalidSignature))
    }
}
