import Foundation

struct NSEDecryptedNotificationMessage {
    let channelId: String
    let userId: String
    let body: String
    let type: Int
}

struct NSEPreparedNotificationPresentation: Equatable {
    let title: String
    let body: String
    let threadIdentifier: String
}

struct NSEPreparedNotificationFallback: Equatable {
    let title: String
    let body: String
}

/// Pure presentation step shared by the live notification extension and its
/// background-flow tests. Keeping this free of UserNotifications makes the
/// security-sensitive auth/fetch/render path deterministic under XCTest.
enum NSENotificationPresenter {
    /// Provider-supplied presentation is untrusted transport input. The live
    /// extension calls this before any fetch so every early-return, failure,
    /// cancellation, and timeout path starts from application-owned text.
    static func makeSafeFallback(
        replacingUntrustedTitle _: String,
        body _: String
    ) -> NSEPreparedNotificationFallback {
        NSEPreparedNotificationFallback(
            title: "Quiet",
            body: "You have new activity"
        )
    }

    static func makePresentation(
        message: NSEDecryptedNotificationMessage,
        channelName: String,
        authenticatedAuthor: String
    ) -> NSEPreparedNotificationPresentation {
        NSEPreparedNotificationPresentation(
            title: NSENotificationPresentation.title(
                channelName: channelName,
                authenticatedAuthor: authenticatedAuthor
            ),
            body: message.body,
            threadIdentifier: message.channelId
        )
    }
}
