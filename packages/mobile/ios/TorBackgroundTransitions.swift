import Foundation

/// Lifecycle-queue-owned completion state for Tor background transitions.
/// Kept independent of the Tor framework so it can run in the host-less test bundle.
final class TorBackgroundTransitions {
  private var completions: [String: (Bool) -> Void] = [:]

  var pendingIds: [String] {
    completions.keys.sorted()
  }

  @discardableResult
  func register(_ transitionId: String, completion: @escaping (Bool) -> Void) -> Bool {
    guard completions[transitionId] == nil else { return false }
    completions[transitionId] = completion
    return true
  }

  func cancel(_ transitionId: String) {
    guard let completion = completions.removeValue(forKey: transitionId) else { return }
    DispatchQueue.main.async { completion(false) }
  }

  @discardableResult
  func finishIfTorUnavailable(hasTorThread: Bool, torThreadIsFinished: Bool) -> Bool {
    guard !hasTorThread || torThreadIsFinished else { return false }
    finishAll(success: true)
    return true
  }

  @discardableResult
  func finishIfDormant(desiresDormant: Bool, isDormant: Bool, commandPending: Bool) -> Bool {
    guard desiresDormant, isDormant, !commandPending else { return false }
    finishAll(success: true)
    return true
  }

  func finishAll(success: Bool) {
    guard !completions.isEmpty else { return }
    let callbacks = Array(completions.values)
    completions.removeAll()
    DispatchQueue.main.async {
      callbacks.forEach { $0(success) }
    }
  }
}
