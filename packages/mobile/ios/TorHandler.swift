import Darwin
import Foundation
import OSLog
import Tor

@objc(TorHandlerDelegate)
protocol TorHandlerDelegate: AnyObject {
  @objc(torHandlerReady:controlPort:httpTunnelPort:authCookie:)
  func torHandlerReady(
    _ handler: TorHandler,
    controlPort: UInt16,
    httpTunnelPort: UInt16,
    authCookie: String
  )
}

@objc(TorHandler)
final class TorHandler: NSObject {
  private enum State: String {
    case stopped
    case starting
    case unknown
    case active
    case dormant
    case stopping
  }

  private enum DesiredMode {
    case stopped
    case active
    case dormant

    var signal: String? {
      switch self {
      case .stopped:
        return nil
      case .active:
        return "ACTIVE"
      case .dormant:
        return "DORMANT"
      }
    }
  }

  private struct PendingModeCommand {
    let id: UInt
    let generation: UInt
    let mode: DesiredMode
  }

  private static let logger = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "com.quietmobile",
    category: "TorHandler"
  )
  private static let cookieLength = 32
  private static let controlTimeout: TimeInterval = 3
  private static let cookieRetryInterval: TimeInterval = 0.1
  private static let slowCookieRetryInterval: TimeInterval = 1
  private static let fastCookieRetryCount = 300
  private static let stableUptime: TimeInterval = 60
  private static let sharedLifecycleQueue = DispatchQueue(label: "com.quietmobile.tor-lifecycle")

  // Tor 0.4.5.9's compiled-in authority identities are stale. Keep this list
  // synchronized with the Tor Project's audited auth_dirs.inc. Bundling these
  // trust anchors keeps bootstrap independent of a runtime network fetch.
  // Source: tor commit 4b996aa6469ac78fe746bcc8d6d8f100643e3c01.
  private static let directoryAuthorities = """
    moria1 orport=9201 v3ident=F533C81CEF0BC0267857C99B2F471ADF249FA232 128.31.0.39:9231 1A25C6358DB91342AA51720A5038B72742732498
    tor26 orport=443 v3ident=2F3DF9CA0E5D36F2685A2DA67184EB8DCB8CBA8C ipv6=[2a02:16a8:662:2203::1]:443 217.196.147.77:80 FAA4BCA4A6AC0FB4CA2F8AD5A11D9E122BA894F6
    dizum orport=443 v3ident=E8A9C45EDE6D711294FADF8E7951F4DE6CA56B58 45.66.35.11:80 7EA6EAD6FD83083C538F44038BBFA077587DD755
    gabelmoo orport=443 v3ident=ED03BB616EB2F60BEC80151114BB25CEF515B226 ipv6=[2001:638:a000:4140::ffff:189]:443 131.188.40.189:80 F2044413DAC2E02E3D6BCF4735A19BCA1DE97281
    dannenberg orport=443 v3ident=0232AF901C31A04EE9848595AF9BB7620D4C5B2E ipv6=[2001:678:558:1000::244]:443 193.23.244.244:80 7BE683E65D48141321C5ED92F075C55364AC7123
    maatuska orport=80 v3ident=49015F787433103580E3B66A1707A00E60F2D15B ipv6=[2001:67c:289c::9]:80 171.25.193.9:443 BD6A829255CB08E66FBE7D3748363586E46B3810
    longclaw orport=443 v3ident=23D15D965BC35114467363C165C4F724B64B4F66 199.58.81.140:80 74A910646BCEEFBCD2E874FC1DC997430F968145
    bastet orport=443 v3ident=27102BC123E7AF1D4741AE047E160C91ADC76B21 ipv6=[2620:13:4000:6000::1000:118]:443 204.13.164.118:80 24E2F139121D4394C54B5BCC368B3B411857C413
    faravahar orport=443 v3ident=70849B868D606BAECFB6128C5E3D782029AA394F 216.218.219.41:80 E3E42D35F801C9D5AB23584E0025D56FE2B33396
    """.split(separator: "\n").map(String.init)

  // Tor.framework registers callbacks globally and appends each registration.
  // Tor 0.4.5.9 also asserts if its callback is registered before init_logging,
  // so install one pair per Tor generation only after control authentication.
  private static func installLoggingCallbacks() {
    TORInstallTorLoggingCallback { severity, message in
      guard severity != .debug, severity != .info else { return }
      let text = String(cString: message).trimmingCharacters(in: .whitespacesAndNewlines)
      if severity == .error || severity == .fault {
        TorHandler.logger.error("Tor: \(text, privacy: .public)")
      } else {
        TorHandler.logger.notice("Tor: \(text, privacy: .public)")
      }
    }

    TORInstallEventLoggingCallback { severity, message in
      guard severity != .debug, severity != .info else { return }
      let text = String(cString: message).trimmingCharacters(in: .whitespacesAndNewlines)
      if severity == .error || severity == .fault {
        TorHandler.logger.error("libevent: \(text, privacy: .public)")
      } else {
        TorHandler.logger.notice("libevent: \(text, privacy: .public)")
      }
    }
  }

  @objc weak var delegate: TorHandlerDelegate?

  // Tor is process-global. Sharing this queue makes the active-thread check and
  // construction atomic even if a second TorHandler is created accidentally.
  private var lifecycleQueue: DispatchQueue { Self.sharedLifecycleQueue }
  private var state = State.stopped
  private var desiredMode = DesiredMode.stopped

  private var configuration: TorConfiguration?
  private var controlPort: UInt16 = 0
  private var httpTunnelPort: UInt16 = 0

  private var torThread: TorThread?
  private var controller: TorController?
  private var monitorTimer: DispatchSourceTimer?

  private var generation: UInt = 0
  private var authenticationAttempt: UInt = 0
  private var commandSequence: UInt = 0
  private var controllerRetrySequence: UInt = 0
  private var readinessSequence: UInt = 0
  private var scheduledControllerRetry: UInt?
  private var scheduledReadiness: UInt?
  private var pendingModeCommand: PendingModeCommand?
  private var restartScheduled = false
  private var restartAttempts = 0
  private var authenticationInFlight = false
  private var readyNotificationPending = false
  private var loggingCallbacksGeneration: UInt?

  private var cookieData: Data?
  private var authCookie: String?

  deinit {
    monitorTimer?.cancel()
  }

  @objc(startWithSocksPort:controlPort:httpTunnelPort:)
  func start(socksPort: UInt16, controlPort: UInt16, httpTunnelPort: UInt16) {
    lifecycleQueue.async { [weak self] in
      guard let self else { return }

      if self.configuration == nil {
        self.configuration = self.makeConfiguration(
          socksPort: socksPort,
          controlPort: controlPort,
          httpTunnelPort: httpTunnelPort
        )
        self.controlPort = controlPort
        self.httpTunnelPort = httpTunnelPort
      }

      self.desiredMode = .active
      self.readyNotificationPending = true
      self.ensureThreadRunning()
    }
  }

  /// Wake the existing Tor instance and notify the app when it is usable.
  /// Repeated foreground callbacks are coalesced on the lifecycle queue.
  @objc func enterForeground() {
    lifecycleQueue.async { [weak self] in
      guard let self else { return }
      self.desiredMode = .active
      self.readyNotificationPending = true
      self.ensureThreadRunning()
      self.applyDesiredMode()
    }
  }

  /// Put Tor into its low-activity mode without destroying process-global state.
  @objc func enterBackground() {
    lifecycleQueue.async { [weak self] in
      guard let self else { return }
      self.desiredMode = .dormant
      self.readyNotificationPending = false
      self.scheduledReadiness = nil
      self.applyDesiredMode()
    }
  }

  /// Explicit teardown is reserved for process termination. Normal app lifecycle
  /// transitions use ACTIVE/DORMANT so Tor is never initialized concurrently.
  @objc func shutdown() {
    lifecycleQueue.async { [weak self] in
      guard let self else { return }
      self.desiredMode = .stopped
      self.readyNotificationPending = false
      self.scheduledReadiness = nil
      self.restartScheduled = false
      self.state = .stopping
      self.pendingModeCommand = nil

      guard let controller = self.controller, controller.isConnected else { return }
      controller.sendCommand("SIGNAL SHUTDOWN", arguments: nil, data: nil) { _, _, stop in
        stop.pointee = true
        return true
      }
    }
  }

  private func makeConfiguration(
    socksPort: UInt16,
    controlPort: UInt16,
    httpTunnelPort: UInt16
  ) -> TorConfiguration {
    let configuration = TorConfiguration()
    configuration.cookieAuthentication = true
    configuration.arguments = [
      "--allow-missing-torrc",
      "--ignore-missing-torrc",
      "--ClientOnly", "1",
      "--AvoidDiskWrites", "1",
      "--SocksPort", "127.0.0.1:\(socksPort)",
      "--ControlPort", "127.0.0.1:\(controlPort)",
      "--HTTPTunnelPort", "127.0.0.1:\(httpTunnelPort)",
      "--Log", "notice stdout",
    ] + Self.directoryAuthorities.flatMap { ["--AlternateDirAuthority", $0] }

    if let dataDirectory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
      .first?.appendingPathComponent("tor", isDirectory: true) {
      try? FileManager.default.createDirectory(at: dataDirectory, withIntermediateDirectories: true)
      configuration.dataDirectory = dataDirectory
    }

    return configuration
  }

  private func ensureThreadRunning() {
    guard desiredMode != .stopped, configuration != nil else { return }

    if let thread = torThread {
      if thread.isFinished {
        handleThreadExit(generation: generation)
      }
      return
    }

    // Tor.framework only keeps a weak process-global reference and does not
    // enforce this in release builds. Treat any active framework thread as a
    // hard serialization barrier, even if it was not created by this handler.
    if let activeThread = TorThread.active {
      if activeThread.isFinished {
        scheduleThreadCheck(after: 0.25)
      } else {
        Self.logger.error("Refusing to initialize Tor while another Tor thread is active")
        scheduleThreadCheck(after: 1)
      }
      return
    }

    startThread()
  }

  private func startThread() {
    guard let configuration, desiredMode != .stopped, torThread == nil else { return }

    removeAuthCookie(configuration: configuration)
    generation &+= 1
    let currentGeneration = generation

    controller = nil
    cookieData = nil
    authCookie = nil
    authenticationInFlight = false
    authenticationAttempt &+= 1
    scheduledControllerRetry = nil
    scheduledReadiness = nil
    pendingModeCommand = nil
    state = .starting
    restartScheduled = false

    let thread = TorThread(configuration: configuration)
    torThread = thread
    thread.start()

    Self.logger.info("Started Tor generation \(currentGeneration)")
    startThreadMonitor(generation: currentGeneration)
    pollForCookie(generation: currentGeneration, attempt: 0)

    lifecycleQueue.asyncAfter(deadline: .now() + Self.stableUptime) { [weak self] in
      guard let self,
            currentGeneration == self.generation,
            self.torThread?.isFinished == false else { return }
      self.restartAttempts = 0
    }
  }

  private func startThreadMonitor(generation: UInt) {
    monitorTimer?.cancel()

    let timer = DispatchSource.makeTimerSource(queue: lifecycleQueue)
    timer.schedule(deadline: .now() + 0.25, repeating: 0.25)
    timer.setEventHandler { [weak self] in
      guard let self else { return }
      guard generation == self.generation else {
        timer.cancel()
        return
      }
      guard self.torThread?.isFinished == true else { return }
      self.handleThreadExit(generation: generation)
    }
    monitorTimer = timer
    timer.resume()
  }

  private func handleThreadExit(generation exitedGeneration: UInt) {
    guard exitedGeneration == generation else { return }

    monitorTimer?.cancel()
    monitorTimer = nil
    controller = nil
    cookieData = nil
    authCookie = nil
    authenticationInFlight = false
    authenticationAttempt &+= 1
    scheduledControllerRetry = nil
    scheduledReadiness = nil
    pendingModeCommand = nil
    torThread = nil
    state = .stopped

    guard desiredMode == .active else {
      Self.logger.info("Tor stopped while the app does not require an active connection")
      return
    }

    readyNotificationPending = true
    restartAttempts += 1
    let exponent = min(max(restartAttempts - 1, 0), 5)
    let delay = min(pow(2, Double(exponent)), 30)
    Self.logger.error("Tor exited unexpectedly; scheduling recovery in \(delay, privacy: .public) seconds")
    scheduleRestart(after: delay, exitedGeneration: exitedGeneration)
  }

  private func scheduleRestart(after delay: TimeInterval, exitedGeneration: UInt) {
    guard !restartScheduled else { return }
    restartScheduled = true

    lifecycleQueue.asyncAfter(deadline: .now() + delay) { [weak self] in
      guard let self else { return }
      guard self.generation == exitedGeneration, self.desiredMode == .active else {
        self.restartScheduled = false
        return
      }
      self.restartScheduled = false
      self.ensureThreadRunning()
    }
  }

  private func scheduleThreadCheck(after delay: TimeInterval) {
    guard !restartScheduled else { return }
    restartScheduled = true
    lifecycleQueue.asyncAfter(deadline: .now() + delay) { [weak self] in
      guard let self else { return }
      self.restartScheduled = false
      self.ensureThreadRunning()
    }
  }

  private func pollForCookie(generation: UInt, attempt: Int) {
    guard generation == self.generation,
          desiredMode != .stopped,
          let thread = torThread else { return }
    guard !thread.isFinished else {
      handleThreadExit(generation: generation)
      return
    }

    if let configuration,
       let data = readAuthCookie(configuration: configuration),
       data.count == Self.cookieLength {
      cookieData = data
      connectController(generation: generation)
      return
    }

    if attempt == Self.fastCookieRetryCount {
      Self.logger.error("Tor control cookie is still unavailable; continuing low-frequency readiness checks")
    }

    let delay = attempt < Self.fastCookieRetryCount
      ? Self.cookieRetryInterval
      : Self.slowCookieRetryInterval
    lifecycleQueue.asyncAfter(deadline: .now() + delay) { [weak self] in
      self?.pollForCookie(generation: generation, attempt: attempt + 1)
    }
  }

  private func connectController(generation: UInt) {
    guard generation == self.generation,
          desiredMode != .stopped,
          let thread = torThread,
          !thread.isFinished,
          let cookieData else { return }
    guard !authenticationInFlight else { return }

    // A direct lifecycle event supersedes a delayed retry. Its sequence token
    // makes any already-enqueued retry closure a no-op.
    scheduledControllerRetry = nil

    let control: TorController
    if let existingController = controller, existingController.isConnected {
      if authCookie != nil {
        applyDesiredMode()
        return
      }
      control = existingController
    } else {
      controller = nil
      guard controlPortIsReachable() else {
        Self.logger.debug("Tor control port is not ready; retrying")
        scheduleControllerRetry(generation: generation)
        return
      }

      let newController = TorController(socketHost: "127.0.0.1", port: controlPort)
      guard newController.isConnected else {
        Self.logger.debug("Tor control port is not ready; retrying")
        scheduleControllerRetry(generation: generation)
        return
      }
      controller = newController
      control = newController
    }

    authenticationInFlight = true
    authenticationAttempt &+= 1
    let attempt = authenticationAttempt

    control.authenticate(with: cookieData) { [weak self, weak control] success, error in
      self?.lifecycleQueue.async {
        guard let self,
              generation == self.generation,
              attempt == self.authenticationAttempt,
              control === self.controller else { return }

        self.authenticationInFlight = false
        if success {
          guard self.desiredMode != .stopped,
                self.torThread?.isFinished == false else { return }
          if self.loggingCallbacksGeneration != generation {
            Self.installLoggingCallbacks()
            self.loggingCallbacksGeneration = generation
          }
          self.authCookie = cookieData.hexEncodedString()
          self.applyDesiredMode()
        } else {
          Self.logger.error("Tor control authentication failed: \(error?.localizedDescription ?? "unknown error", privacy: .public)")
          self.cookieData = nil
          self.authCookie = nil
          self.lifecycleQueue.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.pollForCookie(generation: generation, attempt: 0)
          }
        }
      }
    }

    lifecycleQueue.asyncAfter(deadline: .now() + Self.controlTimeout) { [weak self, weak control] in
      guard let self,
            generation == self.generation,
            attempt == self.authenticationAttempt,
            self.authenticationInFlight,
            control === self.controller else { return }

      self.authenticationInFlight = false
      self.authenticationAttempt &+= 1
      self.controller = nil
      Self.logger.debug("Tor control authentication timed out; reconnecting")
      self.scheduleControllerRetry(generation: generation)
    }
  }

  private func scheduleControllerRetry(generation: UInt) {
    guard generation == self.generation,
          desiredMode != .stopped,
          scheduledControllerRetry == nil else { return }

    controllerRetrySequence &+= 1
    let retry = controllerRetrySequence
    scheduledControllerRetry = retry

    lifecycleQueue.asyncAfter(deadline: .now() + 0.5) { [weak self] in
      guard let self,
            self.scheduledControllerRetry == retry,
            generation == self.generation else { return }
      self.scheduledControllerRetry = nil
      self.connectController(generation: generation)
    }
  }

  private func applyDesiredMode() {
    guard desiredMode != .stopped else { return }

    guard torThread != nil else {
      ensureThreadRunning()
      return
    }
    guard torThread?.isFinished != true else {
      handleThreadExit(generation: generation)
      return
    }
    guard let controller, controller.isConnected, authCookie != nil else {
      if !authenticationInFlight, cookieData != nil {
        connectController(generation: generation)
      }
      return
    }
    guard pendingModeCommand == nil else { return }

    if desiredMode == .active, state == .active {
      notifyReadyIfNeeded()
      return
    }
    if desiredMode == .dormant, state == .dormant {
      return
    }

    sendModeCommand(desiredMode, controller: controller)
  }

  private func sendModeCommand(_ mode: DesiredMode, controller: TorController) {
    guard let signal = mode.signal else { return }

    commandSequence &+= 1
    let command = PendingModeCommand(id: commandSequence, generation: generation, mode: mode)
    pendingModeCommand = command

    controller.sendCommand("SIGNAL \(signal)", arguments: nil, data: nil) { [weak self] codes, _, stop in
      guard let code = codes.first?.intValue else { return false }
      stop.pointee = true
      let success = code == 250
      self?.lifecycleQueue.async {
        self?.finishModeCommand(command, success: success)
      }
      return true
    }

    lifecycleQueue.asyncAfter(deadline: .now() + Self.controlTimeout) { [weak self, weak controller] in
      guard let self,
            self.pendingModeCommand?.id == command.id,
            self.pendingModeCommand?.generation == command.generation,
            controller === self.controller else { return }

      self.pendingModeCommand = nil
      self.state = .unknown
      self.controller = nil
      Self.logger.debug("Tor mode command timed out; reconnecting the controller")
      self.connectController(generation: command.generation)
    }
  }

  private func finishModeCommand(_ command: PendingModeCommand, success: Bool) {
    guard pendingModeCommand?.id == command.id,
          command.generation == generation else { return }

    pendingModeCommand = nil
    if success {
      state = command.mode == .active ? .active : .dormant
      if desiredMode == command.mode {
        if command.mode == .active {
          notifyReadyIfNeeded()
        }
        return
      }
      applyDesiredMode()
    } else {
      state = .unknown
      scheduleControllerRetry(generation: generation)
    }
  }

  private func notifyReadyIfNeeded() {
    guard desiredMode == .active,
          readyNotificationPending,
          scheduledReadiness == nil,
          state == .active,
          torThread?.isFinished == false,
          controller?.isConnected == true,
          !authenticationInFlight,
          let authCookie else { return }

    readinessSequence &+= 1
    let readiness = readinessSequence
    let currentGeneration = generation
    scheduledReadiness = readiness
    let controlPort = controlPort
    let httpTunnelPort = httpTunnelPort

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let shouldDeliver = self.lifecycleQueue.sync {
        guard self.scheduledReadiness == readiness else { return false }
        self.scheduledReadiness = nil

        guard self.generation == currentGeneration,
              self.desiredMode == .active,
              self.state == .active,
              self.torThread?.isFinished == false,
              self.controller?.isConnected == true,
              !self.authenticationInFlight,
              self.authCookie == authCookie else {
          self.applyDesiredMode()
          return false
        }

        self.readyNotificationPending = false
        return true
      }
      guard shouldDeliver else { return }

      self.delegate?.torHandlerReady(
        self,
        controlPort: controlPort,
        httpTunnelPort: httpTunnelPort,
        authCookie: authCookie
      )
    }
  }

  private func controlPortIsReachable() -> Bool {
    let socketDescriptor = Darwin.socket(AF_INET, SOCK_STREAM, 0)
    guard socketDescriptor >= 0 else { return false }
    defer { Darwin.close(socketDescriptor) }

    guard fcntl(socketDescriptor, F_SETFL, O_NONBLOCK) != -1 else { return false }

    var address = sockaddr_in()
    address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    address.sin_family = sa_family_t(AF_INET)
    address.sin_port = controlPort.bigEndian
    address.sin_addr.s_addr = inet_addr("127.0.0.1")

    let connectionResult = withUnsafePointer(to: &address) { pointer in
      pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { socketAddress in
        Darwin.connect(
          socketDescriptor,
          socketAddress,
          socklen_t(MemoryLayout<sockaddr_in>.size)
        )
      }
    }

    if connectionResult == 0 {
      return true
    }
    guard errno == EINPROGRESS else { return false }

    var descriptor = pollfd(fd: socketDescriptor, events: Int16(POLLOUT), revents: 0)
    guard Darwin.poll(&descriptor, 1, 100) > 0 else { return false }

    var socketError: Int32 = 0
    var socketErrorLength = socklen_t(MemoryLayout<Int32>.size)
    guard Darwin.getsockopt(
      socketDescriptor,
      SOL_SOCKET,
      SO_ERROR,
      &socketError,
      &socketErrorLength
    ) == 0 else { return false }

    return socketError == 0
  }

  private func authCookieURL(configuration: TorConfiguration) -> URL? {
    configuration.dataDirectory?.appendingPathComponent("control_auth_cookie", isDirectory: false)
  }

  private func removeAuthCookie(configuration: TorConfiguration) {
    guard let url = authCookieURL(configuration: configuration) else { return }
    try? FileManager.default.removeItem(at: url)
  }

  private func readAuthCookie(configuration: TorConfiguration) -> Data? {
    guard let url = authCookieURL(configuration: configuration) else { return nil }
    return try? Data(contentsOf: url)
  }
}
