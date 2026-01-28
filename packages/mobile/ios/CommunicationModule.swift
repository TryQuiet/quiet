import UserNotifications

@objc(CommunicationModule)
class CommunicationModule: RCTEventEmitter {

  static let BACKEND_EVENT_IDENTIFIER = "backend"
  static let NOTIFICATION_EVENT_IDENTIFIER = "notification"
  static let STOP_EVENT_IDENTIFIER = "stop"
  static let APP_PAUSE_IDENTIFIER = "apppause"
  static let APP_RESUME_IDENTIFIER = "appresume"
  static let NOTIFICATION_PERMISSION_RESULT = "notificationPermissionResult"
  static let DEVICE_TOKEN_RECEIVED = "deviceTokenReceived"

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

  @objc
  func requestNotificationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      DispatchQueue.main.async {
        var body: [String: Any] = ["granted": granted]
        if let error = error {
          body["error"] = error.localizedDescription
        }
        self.sendEvent(withName: CommunicationModule.NOTIFICATION_PERMISSION_RESULT, body: body)
        if granted {
          UIApplication.shared.registerForRemoteNotifications()
        }
        resolve(nil)
      }
    }
  }

  @objc
  func checkNotificationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      let status: String
      switch settings.authorizationStatus {
      case .authorized:
        status = "granted"
      case .denied:
        status = "denied"
      case .notDetermined:
        status = "notDetermined"
      case .provisional:
        status = "provisional"
      case .ephemeral:
        status = "granted"
      @unknown default:
        status = "notDetermined"
      }
      DispatchQueue.main.async {
        self.sendEvent(withName: CommunicationModule.NOTIFICATION_PERMISSION_RESULT, body: ["status": status])
        resolve(nil)
      }
    }
  }

  @objc
  func sendDeviceToken(_ token: String) {
    self.sendEvent(withName: CommunicationModule.DEVICE_TOKEN_RECEIVED, body: ["token": token])
  }

  override func supportedEvents() -> [String]! {
    return [
      CommunicationModule.BACKEND_EVENT_IDENTIFIER,
      CommunicationModule.NOTIFICATION_EVENT_IDENTIFIER,
      CommunicationModule.STOP_EVENT_IDENTIFIER,
      CommunicationModule.APP_PAUSE_IDENTIFIER,
      CommunicationModule.APP_RESUME_IDENTIFIER,
      CommunicationModule.NOTIFICATION_PERMISSION_RESULT,
      CommunicationModule.DEVICE_TOKEN_RECEIVED
    ]
  }
}
