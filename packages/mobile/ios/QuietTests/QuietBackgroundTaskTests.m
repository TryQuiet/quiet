#import <XCTest/XCTest.h>
#import "../QuietBackgroundTask.h"

@interface QuietBackgroundTaskTests : XCTestCase
@property (nonatomic) QuietBackgroundTask *coordinator;
@property (nonatomic) NSMutableArray *expirations;
@property (nonatomic) NSMutableArray<NSNumber *> *ended;
@property (nonatomic) NSMutableArray<NSString *> *pauses;
@end

@implementation QuietBackgroundTaskTests
- (void)setUp {
  [super setUp];
  self.expirations = [NSMutableArray array];
  self.ended = [NSMutableArray array];
  self.pauses = [NSMutableArray array];
  __weak QuietBackgroundTaskTests *weakSelf = self;
  self.coordinator = [[QuietBackgroundTask alloc] initWithInvalidTask:NSUIntegerMax
      beginTask:^NSUInteger(void (^expiration)(void)) {
        [weakSelf.expirations addObject:[expiration copy]];
        return weakSelf.expirations.count;
      } endTask:^(NSUInteger task) {
        [weakSelf.ended addObject:@(task)];
      } sendBackendPause:^(NSString *transition) {
        [weakSelf.pauses addObject:transition];
      }];
}

- (void)ack:(NSString *)transition participant:(NSString *)participant {
  [self.coordinator acknowledgeTransition:transition participant:participant success:YES];
}

- (void)expire:(NSUInteger)index {
  void (^expiration)(void) = self.expirations[index];
  expiration();
}

- (void)testWaitsForEveryParticipantInAnyCompletionOrder {
  NSArray *orders = @[@[@"backend", @"persistence", @"native"],
                      @[@"native", @"backend", @"persistence"],
                      @[@"persistence", @"native", @"backend"]];
  for (NSArray *order in orders) {
    NSString *transition = [self.coordinator beginTransition];
    NSUInteger before = self.ended.count;
    [self ack:transition participant:order[0]];
    [self ack:transition participant:order[1]];
    XCTAssertEqual(self.ended.count, before);
    [self ack:transition participant:order[2]];
    XCTAssertEqual(self.ended.count, before + 1);
    [self.coordinator enterForeground];
  }
}

- (void)testFailureAcknowledgesButDuplicateAndUnknownCallbacksDoNotFinishEarly {
  NSString *transition = [self.coordinator beginTransition];
  [self.coordinator acknowledgeTransition:transition participant:@"native" success:NO];
  [self ack:transition participant:@"native"];
  [self ack:transition participant:@"unknown"];
  [self ack:@"other-transition" participant:@"persistence"];
  [self ack:transition participant:@"backend"];
  XCTAssertEqual(self.ended.count, 0u);
  [self ack:transition participant:@"persistence"];
  [self ack:transition participant:@"persistence"];
  [self expire:0];
  XCTAssertEqualObjects(self.ended, (@[@1]));
}

- (void)testExpirationEndsOnceEvenWhenEveryAcknowledgmentArrivesLater {
  NSString *transition = [self.coordinator beginTransition];
  [self ack:transition participant:@"persistence"];
  [self expire:0];
  [self expire:0];
  [self ack:transition participant:@"backend"];
  [self ack:transition participant:@"native"];
  XCTAssertEqualObjects(self.ended, (@[@1]));
  XCTAssertEqual([self.coordinator pendingTransitionsForParticipant:@"backend"].count, 0u);
}

- (void)testMissingListenersAndStartupRemainBoundedByExpiration {
  NSString *transition = [self.coordinator beginTransition];
  XCTAssertEqual(self.pauses.count, 0u);
  XCTAssertEqualObjects([self.coordinator pendingTransitionsForParticipant:@"persistence"], (@[transition]));
  [self ack:transition participant:@"native"];
  [self expire:0];
  XCTAssertEqualObjects(self.ended, (@[@1]));
  XCTAssertEqual([self.coordinator pendingTransitionsForParticipant:@"persistence"].count, 0u);
  // Startup may finish after expiration. It must still respect background
  // intent, without recreating an assertion or sending the pause twice.
  [self.coordinator backendDidBecomeReady];
  [self.coordinator backendDidBecomeReady];
  XCTAssertEqualObjects(self.pauses, (@[transition]));
  XCTAssertEqual(self.expirations.count, 1u);
}

- (void)testStartupReadinessNeverReplaysPauseOverNewerForeground {
  NSString *transition = [self.coordinator beginTransition];
  [self.coordinator enterForeground];
  [self.coordinator backendDidBecomeReady];
  XCTAssertEqual(self.pauses.count, 0u);
  [self ack:transition participant:@"native"];
  [self ack:transition participant:@"persistence"];
  XCTAssertEqualObjects(self.ended, (@[@1]));
  XCTAssertFalse(self.coordinator.isBackground);
}

- (void)testRapidReversalsShareOneTaskAndKeepAcknowledgmentsSeparate {
  [self.coordinator backendDidBecomeReady];
  NSString *first = [self.coordinator beginTransition];
  XCTAssertEqualObjects([self.coordinator beginTransition], first);
  [self.coordinator enterForeground];
  NSString *latest = [self.coordinator beginTransition];
  XCTAssertNotEqualObjects(first, latest);
  XCTAssertEqualObjects(self.pauses, (@[first, latest]));
  XCTAssertEqual(self.expirations.count, 1u);
  for (NSString *participant in @[@"backend", @"persistence", @"native"]) [self ack:first participant:participant];
  XCTAssertEqual(self.ended.count, 0u);
  XCTAssertTrue(self.coordinator.isBackground);
  for (NSString *participant in @[@"backend", @"persistence", @"native"]) [self ack:latest participant:participant];
  XCTAssertEqualObjects(self.ended, (@[@1]));
}

- (void)testStaleExpirationCannotEndANewerTask {
  NSString *first = [self.coordinator beginTransition];
  [self expire:0];
  [self.coordinator enterForeground];
  NSString *latest = [self.coordinator beginTransition];
  [self expire:0];
  for (NSString *participant in @[@"backend", @"persistence", @"native"]) [self ack:first participant:participant];
  XCTAssertEqualObjects(self.ended, (@[@1]));
  for (NSString *participant in @[@"backend", @"persistence", @"native"]) [self ack:latest participant:participant];
  XCTAssertEqualObjects(self.ended, (@[@1, @2]));
}

- (void)testUnavailableTaskAndSynchronousExpirationDoNotLeakOwnership {
  for (NSNumber *task in @[@(NSUIntegerMax), @42]) {
    NSMutableArray *ended = [NSMutableArray array];
    QuietBackgroundTask *coordinator = [[QuietBackgroundTask alloc] initWithInvalidTask:NSUIntegerMax
        beginTask:^NSUInteger(void (^expiration)(void)) {
          if (task.unsignedIntegerValue == 42) expiration();
          return task.unsignedIntegerValue;
        } endTask:^(NSUInteger value) { [ended addObject:@(value)]; }
        sendBackendPause:^(NSString *transition) {}];
    NSString *transition = [coordinator beginTransition];
    XCTAssertEqual([coordinator pendingTransitionsForParticipant:@"backend"].count, 0u);
    for (NSString *participant in @[@"backend", @"persistence", @"native"]) {
      [coordinator acknowledgeTransition:transition participant:participant success:YES];
    }
    XCTAssertEqual(ended.count, task.unsignedIntegerValue == 42 ? 1u : 0u);
  }
}
@end
