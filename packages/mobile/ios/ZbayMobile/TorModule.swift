
import Tor

@objc(TorModule)
class TorModule: RCTEventEmitter {
  
  private func getTorBaseConfiguration(socksPort: in_port_t, controlPort: in_port_t) -> TorConfiguration {
    let conf = TorConfiguration()
    
    #if DEBUG
    let log_loc = "notice stdout"
    #else
    let log_loc = "notice file /dev/null"
    #endif
    
    conf.cookieAuthentication = true
    
    conf.arguments = [
      "--allow-missing-torrc",
      "--ignore-missing-torrc",
      "--ClientOnly", "1",
      "--AvoidDiskWrites", "1",
      "--SocksPort", "127.0.0.1:\(socksPort)",
      "--ControlPort", "127.0.0.1:\(controlPort)",
      "--Log", log_loc,
    ]
    
    if let dataDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        .first?.appendingPathComponent("tor", isDirectory: true) {
      
      // Create tor data directory if it does not yet exist.
      try? FileManager.default.createDirectory(at: dataDir, withIntermediateDirectories: true)
      
      conf.dataDirectory = dataDir
    }
    
    return conf
  }
  
  private var torThread: TorThread?
  
  @objc(startTor:controlPort:)
  func startTor(socksPort: in_port_t, controlPort: in_port_t) -> Void {
    
    let torBaseConfiguration = getTorBaseConfiguration(
      socksPort: socksPort, controlPort: controlPort
    )
    
    #if DEBUG
    print("[\(String(describing: type(of: self)))] arguments=\(String(describing: torBaseConfiguration.arguments))")
    #endif
    
    torThread = TorThread(configuration: torBaseConfiguration)
    
    torThread?.start()
    
    print("[\(String(describing: type(of: self)))] Starting Tor")
    
    // Wait long enough for Tor itself to have started. It's OK to wait for this
    // because Tor is already trying to connect; this is just the part that polls for
    // progress.
    DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: {
      // Show Tor log in iOS' app log.
      TORInstallTorLoggingCallback { severity, msg in
        let s: String
        
        switch severity {
        case .debug:
          return
          
        case .error:
          s = "error"
          
        case .fault:
          s = "fault"
          
        case .info:
          s = "info"
          
        default:
          s = "default"
        }
        
        // print("[Tor \(s)] \(String(cString: msg).trimmingCharacters(in: .whitespacesAndNewlines))")
      }
      TORInstallEventLoggingCallback { severity, msg in
        let s: String
        
        switch severity {
        case .debug:
          return
          
        case .error:
          s = "error"
          
        case .fault:
          s = "fault"
          
        case .info:
          s = "info"
          
        default:
          s = "default"
        }
        
        // print("[libevent \(s)] \(String(cString: msg).trimmingCharacters(in: .whitespacesAndNewlines))")
      }
      
      var auth: Data? {
        if let cookieUrl = torBaseConfiguration.dataDirectory?.appendingPathComponent("control_auth_cookie") {
          return try? Data(contentsOf: cookieUrl)
        }
        
        return nil
      }
      
      guard let cookie = auth else {
        print("[\(String(describing: type(of: self)))] Could not connect to Tor - cookie unreadable!")
        
        return
      }
      
      #if DEBUG
      print("[\(String(describing: type(of: self)))] cookie=", cookie.hexEncodedString())
      #endif
      
      // Notify client that Tor process has started
      let payload: NSMutableDictionary = [:]
      payload["socksPort"] = socksPort
      payload["controlPort"] = controlPort
      payload["authCookie"] = cookie.hexEncodedString()
      self.sendEvent(withName: "onTorInit", body: payload)
      
    })
  }
  
  @objc
  func createDataDirectory() {
    let paths = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
    let documentsDirectory = paths[0]
    let docURL = URL(string: documentsDirectory)!
    let dataPath = docURL.appendingPathComponent("waggle/files")
    if !FileManager.default.fileExists(atPath: dataPath.path) {
      do {
        try FileManager.default.createDirectory(atPath: dataPath.path, withIntermediateDirectories: true, attributes: nil)
      } catch {
        print(error.localizedDescription)
      }
    }
    self.sendEvent(withName: "onDataDirectoryCreated", body: dataPath.path)
  }
  
  override func supportedEvents() -> [String]! {
    return ["onTorInit", "onDataDirectoryCreated"]
  }
}
