import XCTest

final class TorHandlerLifecycleTests: XCTestCase {
  func testDormantStateDoesNotCompleteWhileAConflictingModeCommandIsPending() {
    let transitions = TorBackgroundTransitions()
    XCTAssertFalse(transitions.finishIfDormant(
      desiresDormant: true,
      isDormant: true,
      commandPending: true
    ))
  }

  func testConfirmedDormantWithNoPendingCommandCanComplete() {
    let transitions = TorBackgroundTransitions()
    XCTAssertTrue(transitions.finishIfDormant(
      desiresDormant: true,
      isDormant: true,
      commandPending: false
    ))
    XCTAssertFalse(transitions.finishIfDormant(
      desiresDormant: false,
      isDormant: true,
      commandPending: false
    ))
  }

  func testBackgroundCompletesWhenTorHasNotStarted() {
    let transitions = TorBackgroundTransitions()
    let completed = expectation(description: "background completion")
    var results: [Bool] = []

    XCTAssertTrue(transitions.register("pause-1") { success in
      XCTAssertTrue(Thread.isMainThread)
      results.append(success)
      completed.fulfill()
    })
    XCTAssertTrue(transitions.finishIfTorUnavailable(hasTorThread: false, torThreadIsFinished: false))

    wait(for: [completed], timeout: 1)
    XCTAssertEqual(results, [true])
  }

  func testCancellationAfterCompletionDoesNotInvokeCallbackAgain() {
    let transitions = TorBackgroundTransitions()
    let completed = expectation(description: "background completion")
    var callbackCount = 0

    XCTAssertTrue(transitions.register("pause-2") { _ in
      callbackCount += 1
      completed.fulfill()
    })
    transitions.finishAll(success: true)
    wait(for: [completed], timeout: 1)

    transitions.cancel("pause-2")
    let queueDrained = expectation(description: "lifecycle queue drained")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      queueDrained.fulfill()
    }
    wait(for: [queueDrained], timeout: 1)
    XCTAssertEqual(callbackCount, 1)
  }
}
