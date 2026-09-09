#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import "../Quiet/AppDelegate.h"
#import "../NodeJsMobile/NodeRunner.hpp"

#define TIMEOUT_SECONDS 600
#define TEXT_TO_LOOK_FOR @"Welcome to React"

@interface QuietTests : XCTestCase

@end

// Exercise native readiness ordering without starting Node or Tor in the tests.
@interface AppDelegate (BackendLifecycleTesting)
- (void)backendDidBecomeReady:(NSNotification *)notification;
- (BOOL)applicationIsInBackground;
- (void)torHandlerReady:(TorHandler *)handler controlPort:(uint16_t)controlPort
        httpTunnelPort:(uint16_t)httpTunnelPort authCookie:(NSString *)authCookie;
- (void)rewireServices:(uint16_t)controlPort httpTunnelPort:(uint16_t)httpTunnelPort
           authCookie:(NSString *)authCookie;
@end

@interface QuietLifecycleTorStub : NSObject
@property (nonatomic) NSUInteger foregroundRequests;
- (void)enterForeground;
@end
@implementation QuietLifecycleTorStub
- (void)enterForeground { self.foregroundRequests += 1; }
@end

@interface QuietLifecycleBackendStub : NSObject
@property (nonatomic, copy) NSString *lastEvent;
- (void)sendMessageToNode:(NSString *)event :(NSString *)message;
@end
@implementation QuietLifecycleBackendStub
- (void)sendMessageToNode:(NSString *)event :(NSString *)message { self.lastEvent = event; }
@end

@interface QuietLifecycleAppDelegate : AppDelegate
@property (nonatomic) BOOL background;
@property (nonatomic) NSUInteger rewires;
@property (nonatomic, copy) NSString *lastCookie;
@end
@implementation QuietLifecycleAppDelegate
- (BOOL)applicationIsInBackground { return self.background; }
- (void)rewireServices:(uint16_t)controlPort httpTunnelPort:(uint16_t)httpTunnelPort
           authCookie:(NSString *)authCookie {
  self.rewires += 1;
  self.lastCookie = authCookie;
}
@end

@interface QuietBackendLifecycleTests : XCTestCase
@end
@implementation QuietBackendLifecycleTests

- (void)testBackendReadyWireMessageReplaysNativeReadiness {
  QuietLifecycleAppDelegate *delegate = [QuietLifecycleAppDelegate new];
  QuietLifecycleTorStub *tor = [QuietLifecycleTorStub new];
  QuietLifecycleBackendStub *backend = [QuietLifecycleBackendStub new];
  delegate.tor = (TorHandler *)tor;
  delegate.nodeJsMobile = (RNNodeJsMobile *)backend;
  [delegate torHandlerReady:delegate.tor controlPort:12001 httpTunnelPort:12002 authCookie:@"early-cookie"];
  XCTAssertEqual(delegate.rewires, 0u);

  XCTestExpectation *ready = [self expectationWithDescription:@"backendReady reaches native lifecycle"];
  id observer = [[NSNotificationCenter defaultCenter] addObserverForName:QuietBackendReadyNotification
      object:nil queue:nil usingBlock:^(NSNotification *notification) {
        XCTAssertTrue([NSThread isMainThread]);
        [delegate backendDidBecomeReady:notification];
        [ready fulfill];
      }];
  // Exact envelope produced by rn-bridge.channel.send('backendReady').
  [NodeRunner handleNodeEventMessage:@"{\"event\":\"message\",\"payload\":\"[\\\"backendReady\\\"]\"}"];
  [self waitForExpectations:@[ready] timeout:2];
  [[NSNotificationCenter defaultCenter] removeObserver:observer];

  XCTAssertEqualObjects(backend.lastEvent, @"resume");
  XCTAssertEqual(tor.foregroundRequests, 1u);
  [delegate torHandlerReady:delegate.tor controlPort:12001 httpTunnelPort:12002 authCookie:@"current-cookie"];
  XCTAssertEqualObjects(delegate.lastCookie, @"current-cookie");
  XCTAssertEqual(delegate.rewires, 1u);
}

- (void)testDirectBackendReadyEventRemainsSupported {
  XCTestExpectation *ready = [self expectationForNotification:QuietBackendReadyNotification object:nil handler:nil];
  [NodeRunner handleNodeEventMessage:@"{\"event\":\"backendReady\",\"payload\":\"[]\"}"];
  [self waitForExpectations:@[ready] timeout:2];
}

- (void)testMalformedWireMessagesDoNotAnnounceReadiness {
  XCTestExpectation *ready = [self expectationForNotification:QuietBackendReadyNotification object:nil handler:nil];
  ready.inverted = YES;
  for (NSString *message in @[@"null", @"{}", @"{\"event\":42}",
      @"{\"event\":\"message\",\"payload\":null}",
      @"{\"event\":\"message\",\"payload\":\"[]\"}",
      @"{\"event\":\"message\",\"payload\":\"[42]\"}"]) {
    XCTAssertNoThrow([NodeRunner handleNodeEventMessage:message]);
  }
  [self waitForExpectations:@[ready] timeout:0.1];
}

- (void)testEarlyTorReadinessIsReplayedAfterBackendListenersExist {
  QuietLifecycleAppDelegate *delegate = [QuietLifecycleAppDelegate new];
  QuietLifecycleTorStub *tor = [QuietLifecycleTorStub new];
  delegate.tor = (TorHandler *)tor;

  [delegate torHandlerReady:delegate.tor controlPort:12001 httpTunnelPort:12002 authCookie:@"early-cookie"];
  XCTAssertEqual(delegate.rewires, 0u);

  [delegate backendDidBecomeReady:nil];
  XCTAssertEqual(tor.foregroundRequests, 1u);
  [delegate torHandlerReady:delegate.tor controlPort:12001 httpTunnelPort:12002 authCookie:@"current-cookie"];
  XCTAssertEqual(delegate.rewires, 1u);
  XCTAssertEqualObjects(delegate.lastCookie, @"current-cookie");
}

- (void)testBackendReadyBeforeTorDoesNotRequireTorToBeReady {
  QuietLifecycleAppDelegate *delegate = [QuietLifecycleAppDelegate new];
  QuietLifecycleTorStub *tor = [QuietLifecycleTorStub new];
  QuietLifecycleBackendStub *backend = [QuietLifecycleBackendStub new];
  delegate.tor = (TorHandler *)tor;
  delegate.nodeJsMobile = (RNNodeJsMobile *)backend;

  [delegate backendDidBecomeReady:nil];
  XCTAssertEqualObjects(backend.lastEvent, @"resume");
  XCTAssertEqual(delegate.rewires, 0u);
  XCTAssertEqual(tor.foregroundRequests, 1u);
  [delegate torHandlerReady:delegate.tor controlPort:12001 httpTunnelPort:12002 authCookie:@"cookie"];
  XCTAssertEqual(delegate.rewires, 1u);
}

- (void)testBackendStartingInBackgroundAvoidsLegacyPauseAndIgnoresTorReadiness {
  QuietLifecycleAppDelegate *delegate = [QuietLifecycleAppDelegate new];
  QuietLifecycleTorStub *tor = [QuietLifecycleTorStub new];
  QuietLifecycleBackendStub *backend = [QuietLifecycleBackendStub new];
  delegate.tor = (TorHandler *)tor;
  delegate.nodeJsMobile = (RNNodeJsMobile *)backend;
  delegate.background = YES;

  [delegate backendDidBecomeReady:nil];
  // Pause is delivered exclusively through NodeRunner's system channel.
  XCTAssertNil(backend.lastEvent);
  XCTAssertEqual(tor.foregroundRequests, 0u);
  [delegate torHandlerReady:delegate.tor controlPort:12001 httpTunnelPort:12002 authCookie:@"cookie"];
  XCTAssertEqual(delegate.rewires, 0u);
}
@end

@implementation QuietTests

- (BOOL)findSubviewInView:(UIView *)view matching:(BOOL(^)(UIView *view))test
{
  if (test(view)) {
    return YES;
  }
  for (UIView *subview in [view subviews]) {
    if ([self findSubviewInView:subview matching:test]) {
      return YES;
    }
  }
  return NO;
}

- (void)testRendersWelcomeScreen
{
  UIViewController *vc = [[[RCTSharedApplication() delegate] window] rootViewController];
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:TIMEOUT_SECONDS];
  BOOL foundElement = NO;

  __block NSString *redboxError = nil;
#ifdef DEBUG
  RCTSetLogFunction(^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
    if (level >= RCTLogLevelError) {
      redboxError = message;
    }
  });
#endif

  while ([date timeIntervalSinceNow] > 0 && !foundElement && !redboxError) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];

    foundElement = [self findSubviewInView:vc.view matching:^BOOL(UIView *view) {
      if ([view.accessibilityLabel isEqualToString:TEXT_TO_LOOK_FOR]) {
        return YES;
      }
      return NO;
    }];
  }

#ifdef DEBUG
  RCTSetLogFunction(RCTDefaultLogFunction);
#endif

  XCTAssertNil(redboxError, @"RedBox error: %@", redboxError);
  XCTAssertTrue(foundElement, @"Couldn't find element with text '%@' in %d seconds", TEXT_TO_LOOK_FOR, TIMEOUT_SECONDS);
}


@end
