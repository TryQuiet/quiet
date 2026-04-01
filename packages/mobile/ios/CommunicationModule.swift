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
  static let NSE_LAST_SYNC_SEQ_KEY = "quiet.nse.lastSyncSeq"
  static let NSE_LAST_SYNC_TEAM_ID_KEY = "quiet.nse.lastSyncTeamId"
  static let NSE_QSS_URLS_KEY = "quiet.nse.qssUrls"
  static let NSE_BADGE_COUNT_KEY = "quiet.nse.badgeCount"
  static let APP_IS_FOREGROUND_KEY = "quiet.app.isForeground"
  static let APP_GROUP_IDENTIFIER = "group.com.quietmobile"

  static let WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_"
  private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "CommunicationModule")

  let keychainHandler = KeychainHandler()
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
    let defaults = UserDefaults(suiteName: CommunicationModule.APP_GROUP_IDENTIFIER) ?? UserDefaults.standard
    defaults.set(false, forKey: CommunicationModule.APP_IS_FOREGROUND_KEY)
    self.sendEvent(withName: CommunicationModule.APP_PAUSE_IDENTIFIER, body: nil)
  }
  
  @objc
  func appResume() {
    let defaults = UserDefaults(suiteName: CommunicationModule.APP_GROUP_IDENTIFIER) ?? UserDefaults.standard
    defaults.set(true, forKey: CommunicationModule.APP_IS_FOREGROUND_KEY)
    defaults.set(0, forKey: CommunicationModule.NSE_BADGE_COUNT_KEY)
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
        let keyAsString: String = keyAsAny as! String
        let data = Data(keyAsString.utf8)
        let decodedNamedKey = try decoder.decode(NamedKey.self, from: data)
        _ = try self.keychainHandler.addLfaKey(namedKey: decodedNamedKey)
        let stored = try self.keychainHandler.getLfaKeyString(keyName: decodedNamedKey.keyName)
        CommunicationModule.logger.info("Stored key matches? \(stored == decodedNamedKey.key) \(decodedNamedKey.keyName)")
      } catch {
        // TODO: send a message to the backend with any keys that weren't stored
        CommunicationModule.logger.error("Error while saving key in keychain: \(error)")
      }
    }
  }

  @objc
  func saveDeviceCredentials(_ deviceId: NSString, teamId: NSString, signingPrivateKey: NSString) {
    let deviceIdStr = deviceId as String
    let teamIdStr = teamId as String
    let keyStr = signingPrivateKey as String
    let accessGroup = Bundle.main.object(forInfoDictionaryKey: "QuietKeychainAccessGroup") as? String

    func writeItem(account: String, value: String) {
      guard let data = value.data(using: .utf8) else {
        CommunicationModule.logger.error("saveDeviceCredentials: failed to encode \(account) as UTF-8")
        return
      }
      // Delete any existing item first to allow updates
      var deleteQuery: [CFString: Any] = [
        kSecClass: kSecClassGenericPassword,
        kSecAttrAccount: account,
      ]
      if let accessGroup {
        deleteQuery[kSecAttrAccessGroup] = accessGroup
      }
      SecItemDelete(deleteQuery as CFDictionary)

      var addQuery: [CFString: Any] = [
        kSecClass: kSecClassGenericPassword,
        kSecAttrAccount: account,
        kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
        kSecValueData: data,
      ]
      if let accessGroup {
        addQuery[kSecAttrAccessGroup] = accessGroup
      }
      let status = SecItemAdd(addQuery as CFDictionary, nil)
      if status != errSecSuccess {
        CommunicationModule.logger.error("saveDeviceCredentials: SecItemAdd failed for \(account): \(status)")
      } else {
        CommunicationModule.logger.info("saveDeviceCredentials: stored \(account)")
      }
    }

    writeItem(account: "quiet.device.id", value: deviceIdStr)
    writeItem(account: "quiet.team.id", value: teamIdStr)
    writeItem(account: "quiet.device.privateKey.\(deviceIdStr)", value: keyStr)
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
    let defaults = UserDefaults(suiteName: CommunicationModule.APP_GROUP_IDENTIFIER) ?? UserDefaults.standard
    var existing = defaults.dictionary(forKey: CommunicationModule.NSE_QSS_URLS_KEY) as? [String: String] ?? [:]

    if existing[teamIdStr] == qssUrlStr {
      CommunicationModule.logger.debug("saveNseQssUrl: unchanged for team \(teamIdStr, privacy: .public)")
      return
    }

    existing[teamIdStr] = qssUrlStr
    defaults.set(existing, forKey: CommunicationModule.NSE_QSS_URLS_KEY)
    CommunicationModule.logger.info("saveNseQssUrl: stored for team \(teamIdStr, privacy: .public)")
  }

  @objc
  func saveNseLastSyncSeq(
    _ teamId: NSString,
    syncSeq: NSNumber
  ) {
    let defaults = UserDefaults(suiteName: CommunicationModule.APP_GROUP_IDENTIFIER) ?? UserDefaults.standard
    let newSyncSeq = syncSeq.doubleValue
    let existingSyncSeq = defaults.double(forKey: CommunicationModule.NSE_LAST_SYNC_SEQ_KEY)
    let teamIdStr = teamId as String

    if existingSyncSeq >= newSyncSeq {
      CommunicationModule.logger.debug(
        "saveNseLastSyncSeq: ignoring stale seq \(newSyncSeq, privacy: .public), existing=\(existingSyncSeq, privacy: .public)"
      )
      return
    }

    defaults.set(newSyncSeq, forKey: CommunicationModule.NSE_LAST_SYNC_SEQ_KEY)
    defaults.set(teamIdStr, forKey: CommunicationModule.NSE_LAST_SYNC_TEAM_ID_KEY)
    CommunicationModule.logger.info("saveNseLastSyncSeq: stored \(newSyncSeq, privacy: .public)")
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

}
