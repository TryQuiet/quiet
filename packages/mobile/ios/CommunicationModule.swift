@objc(CommunicationModule)
class CommunicationModule: RCTEventEmitter {
  
  static let BACKEND_EVENT_IDENTIFIER = "backend"
  static let NOTIFICATION_EVENT_IDENTIFIER = "notification"
  static let STOP_EVENT_IDENTIFIER = "stop"
  
  static let WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_"
  
  @objc
  func sendDataPort(port: UInt16) {
    self.sendEvent(withName: CommunicationModule.BACKEND_EVENT_IDENTIFIER, body: ["channelName": CommunicationModule.WEBSOCKET_CONNECTION_CHANNEL, "payload": ["dataPort": port]])
  }
  
  @objc
  func stopBackend() {
    self.sendEvent(withName: CommunicationModule.STOP_EVENT_IDENTIFIER, body: nil)
  }
  
  override func supportedEvents() -> [String]! {
    return [CommunicationModule.BACKEND_EVENT_IDENTIFIER, CommunicationModule.NOTIFICATION_EVENT_IDENTIFIER, CommunicationModule.STOP_EVENT_IDENTIFIER]
  }
}
