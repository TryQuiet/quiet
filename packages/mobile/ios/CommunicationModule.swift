import UserNotifications
import OSLog

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
  private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "CommunicationModule")

  let keychainHandler = KeychainHandler()
  let userMetadataHandler = UserMetadataHandler()
  
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
  func requestNotificationPermission() {
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
      }
    }
  }
  
  @objc
  func saveKeysInKeychain(_ newKeys: NSArray) {
    let decoder = JSONDecoder()
    for keyAsAny in newKeys {
      do {
        let keyAsString: String = keyAsAny as! String
        let data = Data(keyAsString.utf8)
        let decodedNamedKey = try decoder.decode(NamedKey.self, from: data)
        try self.keychainHandler.addLfaKey(namedKey: decodedNamedKey)
        let stored = try self.keychainHandler.getLfaKeyString(keyName: decodedNamedKey.keyName)
        CommunicationModule.logger.info("Stored key matches? \(stored == decodedNamedKey.key) \(decodedNamedKey.keyName)")
      } catch {
        // TODO: send a message to the backend with any keys that weren't stored
        CommunicationModule.logger.error("Error while saving key in keychain: \(error)")
      }
    }
  }

  @objc
  func saveUserMetadata(_ updatedMetadata: NSArray) {
    let decoder = JSONDecoder()
    var userMetadata: [UserMetadataStruct] = []
    for metadataAsAny in updatedMetadata {
      do {
        let metadataAsString: String = metadataAsAny as! String
        let data = Data(metadataAsString.utf8)
        let decodedMetadata = try decoder.decode(UserMetadataStruct.self, from: data)
        CommunicationModule.logger.info("Decoded user metadata: \(String(describing: decodedMetadata))")
        userMetadata.append(decodedMetadata)
      } catch {
        CommunicationModule.logger.error("Error while decoding user metadata: \(error)")
      }
    }
    
    do {
      try self.userMetadataHandler.saveUserMetadata(updatedMetadata: userMetadata)
    } catch {
      CommunicationModule.logger.error("Error while saving user metadata: \(error)")
    }
    
    for metadata in userMetadata {
      do {
        let stored = try self.userMetadataHandler.fetchUserMetadataById(userId: metadata.userId)
        CommunicationModule.logger.info("Passed: \(String(describing: metadata)), Stored: \(String(describing: stored?.toStruct()))")
      } catch {
        // do nothing
      }
    }
  }

  @objc
  func checkNotificationPermission() {
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
        if status == "granted" {
          UIApplication.shared.registerForRemoteNotifications()
        }
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
