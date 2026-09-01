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

/// Pure presentation step shared by the live notification extension and its
/// background-flow tests. Keeping this free of UserNotifications makes the
/// security-sensitive auth/fetch/render path deterministic under XCTest.
enum NSENotificationPresenter {
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
