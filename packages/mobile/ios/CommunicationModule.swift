import UserNotifications
import OSLog
import UIKit

@objc(CommunicationModule)
class CommunicationModule: RCTEventEmitter {

  static let BACKEND_EVENT_IDENTIFIER = "backend"
  static let NOTIFICATION_EVENT_IDENTIFIER = "notification"
  static let STOP_EVENT_IDENTIFIER = "stop"
  static let APP_PAUSE_IDENTIFIER = "apppause"
  static let APP_RESUME_IDENTIFIER = "appresume"
  static let NOTIFICATION_PERMISSION_RESULT = "notificationPermissionResult"
  static let DEVICE_TOKEN_RECEIVED = "deviceTokenReceived"
  static let INSTALLATION_SENTINEL_KEY = "quiet.installation.initialized"

  static let WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_"
  private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "CommunicationModule")

  let userMetadataHandler = UserMetadataHandler()

  private var hasListeners = false

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
    SharedDefaults.setAppForeground(false)
    self.sendEvent(withName: CommunicationModule.APP_PAUSE_IDENTIFIER, body: nil)
  }

  @objc
  func appResume() {
    SharedDefaults.setAppForeground(true)
    SharedDefaults.setBadgeCount(0)
    UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    if #available(iOS 17.0, *) {
      UNUserNotificationCenter.current().setBadgeCount(0) { error in
        if let error {
          CommunicationModule.logger.error("appResume: failed to clear badge count: \(error)")
        }
      }
    } else {
      UIApplication.shared.applicationIconBadgeNumber = 0
    }
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
        guard let keyAsString = keyAsAny as? String else {
          CommunicationModule.logger.error("saveKeysInKeychain: unexpected non-string element in keys array")
          continue
        }
        let data = Data(keyAsString.utf8)
        let decodedNamedKey = try decoder.decode(NamedKey.self, from: data)
        _ = try KeychainService.addLfaKey(keyName: decodedNamedKey.keyName, key: decodedNamedKey.key)
        let stored = try KeychainService.getLfaKeyString(keyName: decodedNamedKey.keyName)
        CommunicationModule.logger.info("Stored key matches? \(stored == decodedNamedKey.key) \(decodedNamedKey.keyName)")
      } catch {
        // TODO: send a message to the backend with any keys that weren't stored
        CommunicationModule.logger.error("Error while saving key in keychain: \(error)")
      }
    }
  }

  @objc
  func clearSensitiveData() {
    CommunicationModule.clearSensitiveDataImpl()
  }

  @objc
  func saveDeviceCredentials(_ deviceId: NSString, teamId: NSString, signingPrivateKey: NSString) {
    do {
      try KeychainService.saveDeviceCredentials(
        deviceId: deviceId as String,
        teamId: teamId as String,
        signingPrivateKey: signingPrivateKey as String
      )
      CommunicationModule.logger.info("saveDeviceCredentials: stored successfully")
    } catch {
      CommunicationModule.logger.error("saveDeviceCredentials: \(error)")
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
  }

  @objc
  func saveNseQssUrl(_ teamId: NSString, qssUrl: NSString) {
    let teamIdStr = teamId as String
    let qssUrlStr = qssUrl as String
    SharedDefaults.saveQssUrl(teamId: teamIdStr, url: qssUrlStr)
    CommunicationModule.logger.info("saveNseQssUrl: stored for team \(teamIdStr, privacy: .public) as \(qssUrlStr, privacy: .public)")
  }

  @objc
  func saveNseLastSyncSeq(
    _ teamId: NSString,
    syncSeq: NSNumber
  ) {
    let teamIdStr = teamId as String
    let newSyncSeq = syncSeq.int64Value
    SharedDefaults.saveLastSyncSeqAndTeam(newSyncSeq, teamId: teamIdStr)
    CommunicationModule.logger.info("saveNseLastSyncSeq: stored \(newSyncSeq, privacy: .public) for team \(teamIdStr, privacy: .public)")
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
    guard hasListeners else {
      NSLog("Skipping deviceTokenReceived emit because no JS listeners are attached; JS will fetch the current FCM token when ready.")
      return
    }
    self.sendEvent(withName: CommunicationModule.DEVICE_TOKEN_RECEIVED, body: ["token": token])
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
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

  @objc
  static func performFreshInstallCleanupIfNeeded() {
    let defaults = UserDefaults.standard
    if defaults.bool(forKey: CommunicationModule.INSTALLATION_SENTINEL_KEY) {
      return
    }

    CommunicationModule.logger.info("First launch detected, clearing persisted sensitive data")
    CommunicationModule.clearSensitiveDataImpl()
    defaults.set(true, forKey: CommunicationModule.INSTALLATION_SENTINEL_KEY)
  }

  private static func clearSensitiveDataImpl() {
    let userMetadataHandler = UserMetadataHandler()

    do {
      try KeychainService.clearAllQuietData()
    } catch {
      CommunicationModule.logger.error("Failed clearing sensitive keychain data: \(error)")
    }

    do {
      try userMetadataHandler.clearAllUserMetadata()
    } catch {
      CommunicationModule.logger.error("Failed clearing user metadata: \(error)")
    }

    SharedDefaults.clearAll()

    UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    if #available(iOS 17.0, *) {
      UNUserNotificationCenter.current().setBadgeCount(0) { error in
        if let error {
          CommunicationModule.logger.error("clearSensitiveData: failed to clear badge count: \(error)")
        }
      }
    } else {
      DispatchQueue.main.async {
        UIApplication.shared.applicationIconBadgeNumber = 0
      }
    }
  }

}
