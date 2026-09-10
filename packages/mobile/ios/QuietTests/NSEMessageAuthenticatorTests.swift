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

    func testUnknownAuthorsDoNotProducePreviewsOrIncrementBadge() async throws {
        let result = try await runNotificationBatch(authors: ["unknown-id", "another-unknown-id"])

        XCTAssertTrue(result.delivery.notifications.isEmpty)
        XCTAssertNil(result.delivery.badge)
        XCTAssertEqual(result.badge, 7)
        XCTAssertEqual(result.cursor, 12, "skipped messages must not be fetched repeatedly")
    }

    func testOwnMessagesWithoutCachedUsernameProduceNoPreviewsOrBadgeIncrements() async throws {
        let result = try await runNotificationBatch(authors: ["self-id", "self-id"])

        XCTAssertTrue(result.delivery.notifications.isEmpty)
        XCTAssertNil(result.delivery.badge)
        XCTAssertEqual(result.badge, 7)
        XCTAssertEqual(result.cursor, 12)
    }

    func testOwnMessagesWithoutCachedUsernameDoNotHideOtherUsersNotification() async throws {
        let result = try await runNotificationBatch(authors: ["self-id", "alice-id", "self-id"])

        XCTAssertEqual(result.delivery.notifications.map(\.identifier), ["quiet.nse.synced.cid-12"])
        XCTAssertEqual(result.delivery.notifications.map(\.presentation.title), ["Alice in #general"])
        XCTAssertEqual(result.delivery.badge, 8)
        XCTAssertEqual(result.badge, 8)
        XCTAssertEqual(result.cursor, 13)
    }

    func testMixedBatchOnlyPresentsKnownAuthorsAndAdvancesPastUnknownAuthors() async throws {
        let result = try await runNotificationBatch(
            authors: ["unknown-id", "alice-id", "self-id", "alice-id", "unknown-id"]
        )

        XCTAssertEqual(result.delivery.notifications.map(\.identifier), [
            "quiet.nse.synced.cid-12", "quiet.nse.synced.cid-14"
        ])
        XCTAssertEqual(result.delivery.notifications.map(\.presentation.title), [
            "Alice in #general", "Alice in #general"
        ])
        XCTAssertEqual(result.delivery.notifications.map(\.badge), [8, 9])
        XCTAssertEqual(result.delivery.badge, 9)
        XCTAssertEqual(result.badge, 9)
        XCTAssertEqual(result.cursor, 15)
    }

    func testOwnMessagesWithCachedUsernameAreSuppressedByUserIdentity() async throws {
        let result = try await runNotificationBatch(authors: ["self-id", "self-id"], selfNickname: "Me")

        XCTAssertTrue(result.delivery.notifications.isEmpty)
        XCTAssertNil(result.delivery.badge)
        XCTAssertEqual(result.badge, 7)
        XCTAssertEqual(result.cursor, 12)
    }

    func testSelfFilteringUsesUserIdEvenWhenAnotherUserHasTheSameNickname() async throws {
        let result = try await runNotificationBatch(
            authors: ["self-id", "alice-id", "self-id"], selfNickname: "Alice"
        )

        XCTAssertEqual(result.delivery.notifications.map(\.identifier), ["quiet.nse.synced.cid-12"])
        XCTAssertEqual(result.delivery.notifications.map(\.presentation.title), ["Alice in #general"])
        XCTAssertEqual(result.delivery.badge, 8)
        XCTAssertEqual(result.badge, 8)
        XCTAssertEqual(result.cursor, 13)
    }

    func testMissingLocalIdentityDefersCachedSelfAndOtherMessagesWithoutAdvancingSync() async throws {
        let result = try await runNotificationBatch(
            authors: ["self-id", "unknown-id", "alice-id"], selfNickname: "Me", localUserId: nil
        )

        XCTAssertTrue(result.delivery.notifications.isEmpty)
        XCTAssertNil(result.delivery.badge)
        XCTAssertEqual(result.badge, 7)
        XCTAssertEqual(result.cursor, 10)
    }

    func testFailedMixedBatchDeliveryDoesNotPersistBadgeOrCursor() async throws {
        let result = try await runNotificationBatch(
            authors: ["unknown-id", "alice-id"], didDeliver: false
        )

        XCTAssertEqual(result.delivery.notifications.count, 1)
        XCTAssertEqual(result.badge, 7)
        XCTAssertEqual(result.cursor, 10)
    }

    private func runNotificationBatch(
        authors: [String],
        didDeliver: Bool = true,
        selfNickname: String? = nil,
        localUserId: String? = "self-id"
    ) async throws -> (delivery: NSEBackgroundNotificationDelivery, badge: Int, cursor: Int64) {
        let entries = try authors.enumerated().map { index, _ in
            let payload: [String: Any] = [
                "cid": "cid-\(index + 11)",
                "hashedDbId": "channel-db",
                "communityId": "team-id",
                "entry": ["type": "Buffer", "data": [UInt8]()],
                "receivedAt": "2026-09-08T00:00:00Z",
                "syncSeq": index + 11
            ]
            return try JSONDecoder().decode(LogEntry.self, from: JSONSerialization.data(withJSONObject: payload))
        }
        var delivery: NSEBackgroundNotificationDelivery?
        var badge = 7
        var cursor: Int64 = 10
        try await NSEBackgroundNotificationOrchestrator().run(
            teamId: "team-id",
            baselineSeq: cursor,
            localUserId: localUserId,
            crypto: NotificationBatchCrypto(authors: authors),
            fetch: {
                XCTAssertNotNil(localUserId, "defer fetch until local identity is available")
                return LogEntriesResponse(entries: entries, resolvedAfterSeq: 10)
            },
            channelName: { _ in "general" },
            authenticatedAuthor: { $0 == "alice-id" ? "Alice" : ($0 == "self-id" ? selfNickname : nil) },
            storedBadge: { badge },
            saveBadge: { badge = $0 },
            recordMissingNotificationKeyFailure: { _, _ in
                XCTFail("an unknown nickname is not a missing decryption key")
                return 1
            },
            clearMissingNotificationKeyFailure: { _, _ in },
            stageCursor: { _ in },
            deliver: {
                delivery = $0
                return didDeliver
            },
            persistCursor: { cursor = $0 }
        )
        return (try XCTUnwrap(delivery), badge, cursor)
    }

    func testSafeFallbackReplacesUntrustedProviderText() {
        let fallback = NSENotificationPresenter.makeSafeFallback(
            replacingUntrustedTitle: "Quiet Security Alert",
            body: "Your administrator requires urgent verification"
        )

        XCTAssertEqual(
            fallback,
            NSEPreparedNotificationFallback(
                title: "Quiet",
                body: "You have new activity"
            )
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

    func testMissingKeyEventuallyAdvancesPastInvalidEntryAndDeliversLaterEntry() {
        var cursor: Int64 = 10
        var presented: [Int64] = []

        for failureCount in 1...(NSENotificationRetryPolicy.maxMissingKeyFailures + 1) {
            let outcome: NSENotificationProcessingOutcome =
                NSENotificationRetryPolicy.shouldRetryMissingKey(failureCount: failureCount)
                    ? .deliveryFailed
                    : .rejected
            cursor = NSENotificationCursorPolicy.cursor(after: cursor, processing: 11, outcome: outcome)

            if cursor == 11 {
                presented.append(12)
                cursor = NSENotificationCursorPolicy.cursor(after: cursor, processing: 12, outcome: .delivered)
            }
        }

        XCTAssertEqual(cursor, 12)
        XCTAssertEqual(presented, [12])
    }

    func testMissingKeyRetryStatePersistsPerTeamAndResetsForNewSequence() {
        let teamA = "missing-key-retry-team-a-\(UUID().uuidString)"
        let teamB = "missing-key-retry-team-b-\(UUID().uuidString)"

        XCTAssertEqual(SharedDefaults.recordMissingNotificationKeyFailure(teamId: teamA, syncSeq: 11), 1)
        XCTAssertEqual(SharedDefaults.recordMissingNotificationKeyFailure(teamId: teamA, syncSeq: 11), 2)
        XCTAssertEqual(SharedDefaults.recordMissingNotificationKeyFailure(teamId: teamB, syncSeq: 4), 1)
        XCTAssertEqual(SharedDefaults.recordMissingNotificationKeyFailure(teamId: teamA, syncSeq: 11), 3)
        XCTAssertEqual(SharedDefaults.recordMissingNotificationKeyFailure(teamId: teamA, syncSeq: 12), 1)

        SharedDefaults.clearMissingNotificationKeyFailure(teamId: teamA, syncSeq: 12)
        SharedDefaults.clearMissingNotificationKeyFailure(teamId: teamB, syncSeq: 4)
    }
}

private struct NotificationBatchCrypto: DeviceCryptography {
    let authors: [String]

    func decryptNotificationMessage(from logEntry: LogEntry, teamId: String) throws -> NSEDecryptedNotificationMessage? {
        NSEDecryptedNotificationMessage(
            channelId: "channel-id",
            userId: authors[Int(logEntry.syncSeq - 11)],
            body: "Message \(logEntry.syncSeq)",
            type: 1
        )
    }
}
