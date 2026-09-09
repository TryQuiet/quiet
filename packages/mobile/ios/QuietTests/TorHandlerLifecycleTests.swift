import XCTest
@testable import Quiet

final class TorHandlerLifecycleTests: XCTestCase {
  func testDormantStateDoesNotCompleteWhileAConflictingModeCommandIsPending() {
    XCTAssertFalse(TorHandler.canAcknowledgeBackgroundTransition(
      desiresDormant: true,
      isDormant: true,
      commandPending: true
    ))
  }

  func testConfirmedDormantWithNoPendingCommandCanComplete() {
    XCTAssertTrue(TorHandler.canAcknowledgeBackgroundTransition(
      desiresDormant: true,
      isDormant: true,
      commandPending: false
    ))
    XCTAssertFalse(TorHandler.canAcknowledgeBackgroundTransition(
      desiresDormant: false,
      isDormant: true,
      commandPending: false
    ))
  }

  func testBackgroundCompletesWhenTorHasNotStarted() {
    let handler = TorHandler()
    let completed = expectation(description: "background completion")
    var results: [Bool] = []

    handler.enterBackground(transitionId: "pause-1") { success in
      XCTAssertTrue(Thread.isMainThread)
      results.append(success)
      completed.fulfill()
    }

    wait(for: [completed], timeout: 1)
    XCTAssertEqual(results, [true])
  }

  func testCancellationAfterCompletionDoesNotInvokeCallbackAgain() {
    let handler = TorHandler()
    let completed = expectation(description: "background completion")
    var callbackCount = 0

    handler.enterBackground(transitionId: "pause-2") { _ in
      callbackCount += 1
      completed.fulfill()
    }
    wait(for: [completed], timeout: 1)

    handler.cancelBackgroundTransition("pause-2")
    let queueDrained = expectation(description: "lifecycle queue drained")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      queueDrained.fulfill()
    }
    wait(for: [queueDrained], timeout: 1)
    XCTAssertEqual(callbackCount, 1)
  }
}
