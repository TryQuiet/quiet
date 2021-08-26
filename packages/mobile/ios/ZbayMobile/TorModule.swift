
import Tor

@objc(TorModule)
class TorModule: RCTEventEmitter {
  
  enum TorState {
    case none
    case started
    case connected
    case stopped
  }
  
  private var state: TorState = .none
  private var progress = 0
  
  private func getTorBaseConfiguration(socksPort: in_port_t, controlPort: in_port_t) -> TorConfiguration {
    let conf = TorConfiguration()
    
    conf.cookieAuthentication = true
    
    #if DEBUG
    let log_loc = "notice stdout"
    #else
    let log_loc = "notice file /dev/null"
    #endif
    
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
  
  private var torController: TorController?
  
  private var torThread: TorThread?
  
  private var initRetry: DispatchWorkItem?
  
  @objc(startTor:controlPort:)
  func startTor(socksPort: in_port_t, controlPort: in_port_t) -> Void {
    
    cancelInitRetry()
    state = .started
    
    let torBaseConfiguration = getTorBaseConfiguration(
      socksPort: socksPort, controlPort: controlPort
    )
    
    if (self.torController == nil) {
      self.torController = TorController(socketHost: "127.0.0.1", port: controlPort)
    }
    
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
          s = "debug"
          
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
          // Ignore libevent debug messages. Just too many of typically no importance.
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
        
        print("[libevent \(s)] \(String(cString: msg).trimmingCharacters(in: .whitespacesAndNewlines))")
      }
      
      if !(self.torController?.isConnected ?? false) {
        do {
          try self.torController?.connect()
        } catch {
          print("[\(String(describing: TorModule.self))] error=\(error)")
        }
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
      print("[\(String(describing: type(of: self)))] cookie=", cookie.base64EncodedString())
      #endif
      
      self.torController?.authenticate(with: cookie, completion: { success, error in
        if success {
          var completeObs: Any?
          completeObs = self.torController?.addObserver(forCircuitEstablished: { established in
            if established {
              self.state = .connected
              self.torController?.removeObserver(completeObs)
              self.cancelInitRetry()
              #if DEBUG
              print("[\(String(describing: type(of: self)))] Connection established!")
              #endif
            }
          }) // torController.addObserver
          
          var progressObs: Any?
          progressObs = self.torController?.addObserver(forStatusEvents: {
            (type: String, severity: String, action: String, arguments: [String : String]?) -> Bool in
            
            if type == "STATUS_CLIENT" && action == "BOOTSTRAP" {
              let progress = Int(arguments!["PROGRESS"]!)!
              #if DEBUG
              print("[\(String(describing: TorModule.self))] progress=\(progress)")
              #endif
              
              self.progress = progress
              
              #if DEBUG
              print("zbay-ios: [\(String(describing: type(of: self)))] Tor init progress \(progress)")
              #endif
              
              if progress >= 100 {
                self.torController?.removeObserver(progressObs)
                // Notify client that Tor has been successfully initialized
                let payload: NSMutableDictionary = [:]
                payload["socksPort"] = socksPort
                payload["controlPort"] = controlPort
                self.sendEvent(withName: "onTorInit", body: payload)
              }
              
              return true
            }
            
            return false
          }) // torController.addObserver
        } // if success (authenticate)
        else {
          print("[\(String(describing: type(of: self)))] Didn't connect to control port.")
        }
      }) // controller authenticate
    }) //delay
    
    initRetry = DispatchWorkItem {
      // Only do this, if we're not running over a bridge, it will close
      // the connection to the bridge client which will close or break the bridge client!
      #if DEBUG
      print("[\(String(describing: type(of: self)))] Triggering Tor connection retry.")
      #endif
      
      self.torController?.setConfForKey("DisableNetwork", withValue: "1")
      self.torController?.setConfForKey("DisableNetwork", withValue: "0")
    }
    
    // On first load: If Tor hasn't finished bootstrap in 30 seconds,
    // HUP tor once in case we have partially bootstrapped but got stuck.
    DispatchQueue.main.asyncAfter(deadline: .now() + 15, execute: initRetry!)
  }
  
  @objc(startHiddenService:key:)
  func startHiddenService(port: in_port_t, key: String) {
    // Observer command output
    let observer: TORObserverBlock = {_,lines,_ in
      
      var onionAddress = "";
      var onionKey = key;
      
      lines.forEach { Data in
        // Read output line
        let datastring = NSString(data: Data, encoding: String.Encoding.utf8.rawValue)
        
        // Get onion address
        if(datastring?.contains("ServiceID=") == true) {
          let address = datastring!.components(separatedBy: "ServiceID=").last!
          // Make sure address is valid V3
          if address.count == 56 {
            onionAddress = address
          }
        }
        
        // Get private key
        if(datastring?.contains("PrivateKey=") == true) {
          onionKey = datastring!.components(separatedBy: "PrivateKey=").last!
        }
        
        // Send data on command complete
        if(datastring?.contains("OK") == true) {
          let payload: NSMutableDictionary = [:]
          payload["address"] = onionAddress
          payload["key"] = onionKey
          payload["port"] = port
          self.sendEvent(withName: "onOnionAdded", body: payload)
        }
        
        print("zbay: \(datastring ?? "failed to read value from datastring")")
      }
      return true
    }
    torController?.sendCommand("ADD_ONION", arguments: [key, "Flags=Detach", "Port=\(port)"], data: nil, observer: observer)
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
  
  func stopTor() {
    print("[\(String(describing: type(of: self)))] #stopTor")
    
    // Under the hood, TORController will SIGNAL SHUTDOWN and set it's channel to nil, so
    // we actually rely on that to stop Tor and reset the state of torController. (we can
    // SIGNAL SHUTDOWN here, but we can't reset the torController "isConnected" state.)
    torController?.disconnect()
    torController = nil
    
    // More cleanup
    torThread?.cancel()
    torThread = nil
    
    state = .stopped
  }
  
  private func cancelInitRetry() {
    initRetry?.cancel()
    initRetry = nil
  }
  
  override func supportedEvents() -> [String]! {
    return ["onTorInit", "onOnionAdded", "onDataDirectoryCreated"]
  }
}
