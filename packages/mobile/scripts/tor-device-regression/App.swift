import Darwin
import Foundation
import Tor
import UIKit

// A separate app preserves the installed Quiet account. UIKit really suspends
// this process; calling enterBackground() inside a simulator test is insufficient.
@main final class App: UIResponder, UIApplicationDelegate, TorHandlerDelegate {
  var window: UIWindow?
  private let handler = TorHandler()
  private let probeQueue = DispatchQueue(label: "tor-device-regression.probe")
  private var status: [String: Any] = ["readyCount": 0, "backgroundCount": 0, "pid": getpid()]
  private var firstCookie: String?
  private weak var firstThread: TorThread?
  private var retainedOnion: String?
  private let rapidRequested = ProcessInfo.processInfo.arguments.contains("rapid-transitions")
  private var rapidStarted = false
  private var rapidCallbacks = 0
  private let socksPort: UInt16 = 19050
  private let controlPort: UInt16 = 19051
  private let httpPort: UInt16 = 19052

  func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    window = UIWindow(frame: UIScreen.main.bounds)
    window?.rootViewController = UIViewController()
    window?.rootViewController?.view.backgroundColor = .systemBackground
    window?.makeKeyAndVisible()
    handler.delegate = self
    record(["phase": "starting", "controlPort": controlPort, "socksPort": socksPort, "httpPort": httpPort])
    handler.start(socksPort: socksPort, controlPort: controlPort, httpTunnelPort: httpPort)
    return true
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    handler.enterForeground()
  }

  func applicationDidEnterBackground(_ application: UIApplication) {
    let transition = UUID().uuidString
    var task = UIBackgroundTaskIdentifier.invalid
    task = application.beginBackgroundTask(withName: "TorRegressionBackground") { [weak self] in
      self?.handler.cancelBackgroundTransition(transition)
      if task != .invalid { application.endBackgroundTask(task); task = .invalid }
    }
    record(["phase": "background-pending"])
    handler.enterBackground(transitionId: transition) { [weak self] success in
      guard let self else { return }
      self.record([
        "phase": "background", "backgroundAcknowledged": success,
        "backgroundPortsClosed": [self.socksPort, self.controlPort, self.httpPort].allSatisfy {
          (try? Control(port: $0)) == nil
        },
        "backgroundCount": (self.status["backgroundCount"] as? Int ?? 0) + 1,
      ])
      if task != .invalid { application.endBackgroundTask(task); task = .invalid }
    }
  }

  func torHandlerReady(_ handler: TorHandler, controlPort: UInt16, httpTunnelPort: UInt16, authCookie: String) {
    let count = (status["readyCount"] as? Int ?? 0) + 1
    let sameCookie = firstCookie == nil || firstCookie == authCookie
    let sameThread = count == 1 || firstThread === TorThread.active
    firstCookie = authCookie
    firstThread = TorThread.active
    record(["phase": "probing", "readyCount": count, "sameCookie": sameCookie, "sameThread": sameThread])
    probeQueue.async {
      do {
        let control = try Control(port: controlPort)
        _ = try control.command("AUTHENTICATE \(authCookie)")
        let version = try control.command("GETINFO version status/bootstrap-phase")
        guard try control.command("GETCONF DisableNetwork").contains("DisableNetwork=0") else {
          throw ProbeError.failed("Tor networking remains disabled after resume")
        }
        if let onion = self.retainedOnion {
          let services = try control.command("GETINFO onions/detached")
          guard services.contains(onion) else { throw ProbeError.failed("detached onion lost on resume") }
        } else {
          let response = try control.command("ADD_ONION NEW:ED25519-V3 Flags=Detach Port=80,127.0.0.1:1")
          self.retainedOnion = try Self.serviceID(response)
        }
        // This is the account-creation operation that failed on the alpha. No
        // bootstrap or publication wait: the control connection owns this onion.
        _ = try Self.serviceID(control.command("ADD_ONION NEW:ED25519-V3 Port=80,127.0.0.1:1"))
        let socks = try Control(port: self.socksPort)
        let greeting = try socks.exchange(Data([5, 1, 0]))
        guard greeting == Data([5, 0]) else { throw ProbeError.failed("invalid SOCKS greeting") }
        _ = try Control(port: httpTunnelPort)
        DispatchQueue.main.async {
          if self.rapidRequested && !self.rapidStarted {
            self.rapidStarted = true
            self.record(["phase": "rapid-transitions"])
            // Supersede background commands while they are still in flight.
            // Each cancelled waiter must complete once and final intent wins.
            for index in 0..<20 {
              self.handler.enterBackground(transitionId: "rapid-\(index)") { _ in
                self.rapidCallbacks += 1
              }
              self.handler.enterForeground()
            }
            return
          }
          self.record(["phase": "ready",
                       "passed": sameCookie && sameThread && (!self.rapidRequested || self.rapidCallbacks == 20),
                       "rapidCallbacks": self.rapidCallbacks,
                       "onionCreated": true, "onionRetained": true, "socksReady": true,
                       "versionAndBootstrap": version])
        }
      } catch {
        DispatchQueue.main.async { self.record(["phase": "failed", "passed": false, "error": "\(error)"]) }
      }
    }
  }

  private static func serviceID(_ response: String) throws -> String {
    guard let line = response.components(separatedBy: "\r\n").first(where: { $0.hasPrefix("250-ServiceID=") }) else {
      throw ProbeError.failed("ADD_ONION did not return an identity")
    }
    let id = String(line.dropFirst("250-ServiceID=".count))
    guard id.count == 56 else { throw ProbeError.failed("invalid v3 onion identity") }
    return id
  }

  private func record(_ update: [String: Any]) {
    status.merge(update) { _, new in new }
    status["updatedAt"] = Date().timeIntervalSince1970
    let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    if let data = try? JSONSerialization.data(withJSONObject: status, options: [.sortedKeys]) {
      try? data.write(to: directory.appendingPathComponent("status.json"), options: .atomic)
    }
  }
}

private enum ProbeError: Error { case failed(String) }

private final class Control {
  private var fd: Int32 = -1
  init(port: UInt16) throws {
    fd = socket(AF_INET, SOCK_STREAM, 0)
    guard fd >= 0 else { throw ProbeError.failed("socket creation failed") }
    var timeout = timeval(tv_sec: 3, tv_usec: 0)
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &timeout, socklen_t(MemoryLayout<timeval>.size))
    var noSigPipe: Int32 = 1
    setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &noSigPipe, socklen_t(MemoryLayout<Int32>.size))
    var address = sockaddr_in()
    address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    address.sin_family = sa_family_t(AF_INET)
    address.sin_port = port.bigEndian
    address.sin_addr.s_addr = inet_addr("127.0.0.1")
    let result = withUnsafePointer(to: &address) { ptr in
      ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { Darwin.connect(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) }
    }
    guard result == 0 else { Darwin.close(fd); fd = -1; throw ProbeError.failed("connect \(port) failed: \(errno)") }
  }
  deinit { if fd >= 0 { Darwin.close(fd) } }

  func exchange(_ bytes: Data) throws -> Data {
    let written = bytes.withUnsafeBytes { Darwin.send(fd, $0.baseAddress, $0.count, 0) }
    guard written == bytes.count else { throw ProbeError.failed("socket write failed") }
    return try read()
  }
  private func read() throws -> Data {
    var bytes = [UInt8](repeating: 0, count: 4096)
    let count = Darwin.recv(fd, &bytes, bytes.count, 0)
    guard count > 0 else { throw ProbeError.failed("socket reply failed: \(errno)") }
    return Data(bytes.prefix(count))
  }
  func command(_ command: String) throws -> String {
    var response = String(decoding: try exchange(Data("\(command)\r\n".utf8)), as: UTF8.self)
    while response.range(of: "(?:^|\\r\\n)[0-9]{3} [^\\r\\n]*\\r\\n$", options: .regularExpression) == nil {
      response += String(decoding: try read(), as: UTF8.self)
    }
    guard response.contains("250 ") else { throw ProbeError.failed("control command rejected") }
    return response
  }
}
