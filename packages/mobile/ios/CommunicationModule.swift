@objc(CommunicationModule)
class CommunicationModule: RCTEventEmitter {
  
  static let BACKEND_EVENT_IDENTIFIER = "backend"
  static let NOTIFICATION_EVENT_IDENTIFIER = "notification"
  
  static let WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_"
  
  @objc
  func sendDataPort(port: UInt16) {
    let body = BackendEvent(
      channelName: CommunicationModule.WEBSOCKET_CONNECTION_CHANNEL,
      payload: port
    )
    self.sendEvent(withName: CommunicationModule.BACKEND_EVENT_IDENTIFIER, body: body)
  }
  
  override func supportedEvents() -> [String]! {
    return [CommunicationModule.BACKEND_EVENT_IDENTIFIER, CommunicationModule.NOTIFICATION_EVENT_IDENTIFIER]
  }
}

struct BackendEvent {
  var channelName: String
  var payload: Any
}
