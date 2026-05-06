@objcMembers
class WebsocketSingleton: NSObject {
    static let sharedInstance = WebsocketSingleton()

    var socketPort: UInt16 = 0
    var socketIOSecret: String = ""

    private override init() {}
}
