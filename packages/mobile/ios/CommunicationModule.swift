@objc(CommunicationModule)
class CommunicationModule: RCTEventEmitter {
  
  static let BACKEND_EVENT_IDENTIFIER = "backend"
  static let NOTIFICATION_EVENT_IDENTIFIER = "notification"
  static let STOP_EVENT_IDENTIFIER = "stop"
  static let APP_PAUSE_IDENTIFIER = "apppause"
  static let APP_RESUME_IDENTIFIER = "appresume"
  
  static let WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_"
  
  @objc
  func sendDataPort(port: UInt16, socketIOSecret: String) {
    self.sendEvent(withName: CommunicationModule.BACKEND_EVENT_IDENTIFIER, body: ["channelName": CommunicationModule.WEBSOCKET_CONNECTION_CHANNEL, "payload": ["dataPort": port, "socketIOSecret": socketIOSecret]])
  }
  
  @objc
  func stopBackend() {
    self.sendEvent(withName: CommunicationModule.STOP_EVENT_IDENTIFIER, body: nil)
  }
  
  @objc
  func appPause() {
    self.sendEvent(withName: CommunicationModule.APP_PAUSE_IDENTIFIER, body: nil)
  }
  
  @objc
  func appResume() {
    self.sendEvent(withName: CommunicationModule.APP_RESUME_IDENTIFIER, body: nil)
  }
  
  @objc
  func handleIncomingEvents(_ event: NSString, payload: NSString?, extra: NSString?) {
    let socketPort = WebsocketSingleton.sharedInstance.socketPort
    let socketIOSecret = WebsocketSingleton.sharedInstance.socketIOSecret
    self.sendDataPort(port: socketPort, socketIOSecret: socketIOSecret);
  }
  
  override func supportedEvents() -> [String]! {
    return [CommunicationModule.BACKEND_EVENT_IDENTIFIER, CommunicationModule.NOTIFICATION_EVENT_IDENTIFIER, CommunicationModule.STOP_EVENT_IDENTIFIER, CommunicationModule.APP_PAUSE_IDENTIFIER, CommunicationModule.APP_RESUME_IDENTIFIER]
  }
}
