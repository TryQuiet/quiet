import Darwin
import XCTest
import Tor
@testable import Quiet

/// Runs real Tor through Quiet's production lifecycle handler. Exercises the
/// control operations that stalled in #3237; this is not a full community UI test.
final class TorControlRegressionTests: XCTestCase, TorHandlerDelegate {
  private var ready: XCTestExpectation?
  private var port: UInt16 = 0
  private var cookie = Data()

  func torHandlerReady(_ handler: TorHandler, controlPort: UInt16,
                       httpTunnelPort: UInt16, authCookie: String) {
    port = controlPort
    cookie = Data(stride(from: 0, to: authCookie.count, by: 2).map { offset in
      let start = authCookie.index(authCookie.startIndex, offsetBy: offset)
      return UInt8(authCookie[start..<authCookie.index(start, offsetBy: 2)], radix: 16)!
    })
    ready?.fulfill()
    ready = nil
  }

  private func freePort() throws -> UInt16 {
    let fd = socket(AF_INET, SOCK_STREAM, 0)
    XCTAssertGreaterThanOrEqual(fd, 0)
    defer { close(fd) }
    var address = sockaddr_in()
    address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    address.sin_family = sa_family_t(AF_INET)
    address.sin_addr.s_addr = inet_addr("127.0.0.1")
    var size = socklen_t(MemoryLayout<sockaddr_in>.size)
    try withUnsafeMutablePointer(to: &address) { pointer in
      try pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        guard bind(fd, $0, size) == 0, getsockname(fd, $0, &size) == 0 else {
          throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno))
        }
      }
    }
    return UInt16(bigEndian: address.sin_port)
  }

  private func backendControl(timeout: TimeInterval = 5) throws -> BackendControl {
    let control = try BackendControl(port: port, timeout: timeout)
    try command(control, "AUTHENTICATE " + cookie.hexEncodedString())
    return control
  }

  @discardableResult
  private func command(_ control: BackendControl, _ text: String) throws -> [String] {
    let completed = expectation(description: String(text.prefix { $0 != " " }))
    var result: Result<[String], Error>?
    // The real backend runs off the UIKit main thread too.
    DispatchQueue.global().async {
      result = Result { try control.command(text) }
      completed.fulfill()
    }
    guard XCTWaiter.wait(for: [completed], timeout: control.timeout + 2) == .completed else {
      throw NSError(domain: "TorControlRegression", code: 1)
    }
    return try XCTUnwrap(result).get()
  }

  private func value(_ key: String, in lines: [String]) throws -> String {
    let prefix = key + "="
    return try XCTUnwrap(lines.first(where: { $0.hasPrefix(prefix) }).map { String($0.dropFirst(prefix.count)) })
  }

  func testRepeatedLeaveForegroundRejoinKeepsControlAndOnionIdentity() throws {
    let handler = TorHandler()
    handler.delegate = self
    let initialReady = expectation(description: "production Tor handler ready")
    ready = initialReady
    handler.start(socksPort: try freePort(), controlPort: try freePort(), httpTunnelPort: try freePort())
    defer { handler.shutdown() }
    _ = try XCTUnwrap(XCTWaiter.wait(for: [initialReady], timeout: 45) == .completed ? handler : nil)
    let thread = try XCTUnwrap(TorThread.active)
    let originalPort = port
    let originalCookie = cookie
    var control = try backendControl(timeout: 30)
    let version = try value("version", in: command(control, "GETINFO version"))
    XCTAssertEqual(version.split(separator: " ").first, "0.4.9.11")
    print("TOR_REGRESSION runtimeVersion=\(version)")
    let deadline = Date().addingTimeInterval(180)
    var bootstrapped = false
    repeat {
      let phase = try command(control, "GETINFO status/bootstrap-phase")
      bootstrapped = phase.contains { $0.contains("PROGRESS=100 ") }
      if bootstrapped { break }
      let tick = expectation(description: "bootstrap polling")
      DispatchQueue.main.asyncAfter(deadline: .now() + 1) { tick.fulfill() }
      wait(for: [tick], timeout: 2)
    } while Date() < deadline
    XCTAssertTrue(bootstrapped, "Live Tor must bootstrap before exercising post-join lifecycle")
    print("TOR_REGRESSION bootstrapped=\(bootstrapped)")
    let created = try command(control, "ADD_ONION NEW:ED25519-V3 Flags=Detach Port=80,127.0.0.1:1")
    let serviceID = try value("ServiceID", in: created)
    let privateKey = try value("PrivateKey", in: created)

    for cycle in 0..<20 {
      // Leave destroys the backend controller and hidden service, while native
      // Tor survives. Vary whether the app backgrounds and whether wake races.
      try command(control, "DEL_ONION \(serviceID)")
      control.close()
      if cycle % 3 != 0 {
        let dormant = expectation(description: "background acknowledgment \(cycle)")
        handler.enterBackground(transitionId: "regression-\(cycle)") { success in
          if cycle % 3 == 1 { XCTAssertTrue(success) }
          dormant.fulfill()
        }
        if cycle % 3 == 2 { handler.enterForeground() }
        XCTAssertEqual(XCTWaiter.wait(for: [dormant], timeout: 5), .completed)
      }
      let foreground = expectation(description: "foreground readiness \(cycle)")
      ready = foreground
      handler.enterForeground()
      XCTAssertEqual(XCTWaiter.wait(for: [foreground], timeout: 5), .completed)
      XCTAssertTrue(TorThread.active === thread, "Foreground must retain the process-global Tor thread")
      XCTAssertEqual(port, originalPort)
      XCTAssertEqual(cookie, originalCookie)
      control = try backendControl()
      // These are the exact operations that wedged/queued in #3237.
      let bootstrap = try command(control, "GETINFO status/bootstrap-phase")
      XCTAssertTrue(bootstrap.contains { $0.contains("PROGRESS=") })
      let rejoined = try command(control, "ADD_ONION \(privateKey) Flags=Detach Port=80,127.0.0.1:1")
      XCTAssertEqual(try value("ServiceID", in: rejoined), serviceID)
      print("TOR_REGRESSION cycle=\(cycle + 1) control=responsive identity=preserved")
    }
    try command(control, "DEL_ONION \(serviceID)")
  }
}

/// Node's backend uses its own TCP control socket, not TorController.disconnect()
/// (which sends SIGNAL SHUTDOWN). Match that boundary and bound every read/write.
private final class BackendControl {
  private var fd: Int32
  let timeout: TimeInterval

  init(port: UInt16, timeout: TimeInterval) throws {
    self.timeout = timeout
    fd = socket(AF_INET, SOCK_STREAM, 0)
    guard fd >= 0 else { throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno)) }
    var socketTimeout = timeval(tv_sec: Int(timeout), tv_usec: 0)
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &socketTimeout, socklen_t(MemoryLayout<timeval>.size))
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &socketTimeout, socklen_t(MemoryLayout<timeval>.size))
    var yes: Int32 = 1
    setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &yes, socklen_t(MemoryLayout<Int32>.size))
    var address = sockaddr_in()
    address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    address.sin_family = sa_family_t(AF_INET)
    address.sin_port = port.bigEndian
    address.sin_addr.s_addr = inet_addr("127.0.0.1")
    let result = withUnsafePointer(to: &address) {
      $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
        connect(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
      }
    }
    if result != 0 {
      let code = errno
      close()
      throw NSError(domain: NSPOSIXErrorDomain, code: Int(code))
    }
  }

  deinit { close() }
  func close() {
    if fd >= 0 { Darwin.close(fd); fd = -1 }
  }

  @discardableResult
  func command(_ text: String) throws -> [String] {
    let operation = String(text.prefix { $0 != " " })
    let bytes = Array((text + "\r\n").utf8)
    try bytes.withUnsafeBytes { buffer in
      var sent = 0
      while sent < bytes.count {
        let count = send(fd, buffer.baseAddress!.advanced(by: sent), bytes.count - sent, 0)
        guard count > 0 else { throw failure(operation) }
        sent += count
      }
    }
    var received = Data()
    var buffer = [UInt8](repeating: 0, count: 4096)
    let deadline = Date().addingTimeInterval(timeout)
    while Date() < deadline {
      let count = recv(fd, &buffer, buffer.count, 0)
      guard count > 0 else { throw failure(operation) }
      received.append(contentsOf: buffer.prefix(count))
      let lines = String(decoding: received, as: UTF8.self).components(separatedBy: "\r\n")
      if let last = lines.dropLast().last, last.count >= 4,
         last[last.index(last.startIndex, offsetBy: 3)] == " " {
        guard lines.dropLast().allSatisfy({ $0.hasPrefix("250") }) else { throw failure(operation) }
        return lines.dropLast().map { String($0.dropFirst(4)) }
      }
    }
    throw failure(operation)
  }

  private func failure(_ operation: String) -> NSError {
    // Never print AUTHENTICATE/ADD_ONION arguments or the returned private key.
    NSError(domain: "TorControlRegression", code: Int(errno),
            userInfo: [NSLocalizedDescriptionKey: "\(operation) failed or exceeded \(Int(timeout)) seconds"])
  }
}
