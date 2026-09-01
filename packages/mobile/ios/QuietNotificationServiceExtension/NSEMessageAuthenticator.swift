import CryptoKit
import Foundation

enum NSEMessageAuthenticationError: Error {
    case malformedSignature
    case invalidAuthor
    case immutableFieldMismatch
    case invalidSignature
}

enum NSENotificationProcessingOutcome {
    case rejected
    case delivered
    case deliveryFailed
}

enum NSENotificationCursorPolicy {
    static func cursor(
        after current: Int64,
        processing entrySequence: Int64,
        outcome: NSENotificationProcessingOutcome
    ) -> Int64 {
        switch outcome {
        case .rejected, .delivered:
            return entrySequence
        case .deliveryFailed:
            return current
        }
    }
}

/// Pure notification-message authentication shared by the NSE and its native regression tests.
/// The caller supplies the exact decrypted MessagePack bytes; they are never re-encoded.
enum NSEMessageAuthenticator {
    private static let context = "lf/auth/team-message"

    static func signaturePayload(_ plaintext: Data) -> Data {
        let contextBytes = Data(context.utf8)
        precondition(contextBytes.count <= 31)
        return Data([0x92, 0xa0 | UInt8(contextBytes.count)]) + contextBytes + plaintext
    }

    static func authenticate(
        plaintext: Data,
        signature: Data?,
        publicKey: Data?,
        authorType: String?,
        authorName: String?,
        messageUserId: String,
        messageId: String,
        envelopeId: String?,
        messageTeamId: String,
        envelopeTeamId: String?,
        requestedTeamId: String,
        messageChannelId: String,
        envelopeChannelId: String?,
        messageCreatedAt: Double,
        envelopeCreatedAt: Double?
    ) throws {
        try validateClaims(
            signature: signature,
            authorType: authorType,
            authorName: authorName,
            messageUserId: messageUserId,
            messageId: messageId,
            envelopeId: envelopeId,
            messageTeamId: messageTeamId,
            envelopeTeamId: envelopeTeamId,
            requestedTeamId: requestedTeamId,
            messageChannelId: messageChannelId,
            envelopeChannelId: envelopeChannelId,
            messageCreatedAt: messageCreatedAt,
            envelopeCreatedAt: envelopeCreatedAt
        )
        guard
            let signature,
            let publicKey,
            publicKey.count == 32
        else {
            throw NSEMessageAuthenticationError.malformedSignature
        }

        let verificationKey = try Curve25519.Signing.PublicKey(rawRepresentation: publicKey)
        guard verificationKey.isValidSignature(signature, for: signaturePayload(plaintext)) else {
            throw NSEMessageAuthenticationError.invalidSignature
        }
    }

    static func validateClaims(
        signature: Data?,
        authorType: String?,
        authorName: String?,
        messageUserId: String,
        messageId: String,
        envelopeId: String?,
        messageTeamId: String,
        envelopeTeamId: String?,
        requestedTeamId: String,
        messageChannelId: String,
        envelopeChannelId: String?,
        messageCreatedAt: Double,
        envelopeCreatedAt: Double?
    ) throws {
        guard let signature, signature.count == 64 else {
            throw NSEMessageAuthenticationError.malformedSignature
        }
        guard authorType == "USER", authorName == messageUserId else {
            throw NSEMessageAuthenticationError.invalidAuthor
        }
        guard
            envelopeId == messageId,
            envelopeTeamId == messageTeamId,
            messageTeamId == requestedTeamId,
            envelopeChannelId == messageChannelId,
            envelopeCreatedAt == messageCreatedAt
        else {
            throw NSEMessageAuthenticationError.immutableFieldMismatch
        }
    }
}
