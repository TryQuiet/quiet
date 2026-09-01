import CryptoKit
import XCTest

final class NSEMessageAuthenticatorTests: XCTestCase {
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
}
