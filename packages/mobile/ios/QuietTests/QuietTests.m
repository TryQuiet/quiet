#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <FirebaseCore/FirebaseCore.h>
#import <React/RCTBridgeModule.h>

// Exercise the actual Swift module exported to React Native. Runtime lookup
// avoids depending on the app target's private generated Swift header.
@protocol QuietFirebaseMessagingTesting <NSObject>
- (void)getToken:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
- (void)deleteToken:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
- (void)subscribeToTopic:(NSString *)topic resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
- (void)unsubscribeFromTopic:(NSString *)topic resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
@end

@interface QuietTests : XCTestCase
@end

@implementation QuietTests

- (BOOL)setUpWithError:(NSError **)error
{
  if (![super setUpWithError:error]) {
    return NO;
  }
  // Run against the development app with an empty GoogleService-Info.plist.
  // Never remove an existing Firebase configuration to arrange a test.
  XCTSkipIf([FIRApp defaultApp] != nil, @"Requires an app without Firebase configuration");
  return YES;
}

- (void)assertUnavailableOperation:(void (^)(id<QuietFirebaseMessagingTesting>, RCTPromiseResolveBlock, RCTPromiseRejectBlock))operation
{
  Class moduleClass = NSClassFromString(@"FirebaseMessagingModule");
  XCTAssertNotNil(moduleClass, @"The production native module must be linked");
  id<QuietFirebaseMessagingTesting> module = [[moduleClass alloc] init];
  __block NSUInteger resolutions = 0;
  __block NSUInteger rejections = 0;
  RCTPromiseResolveBlock resolve = ^(id result) {
    resolutions += 1;
  };
  RCTPromiseRejectBlock reject = ^(NSString *code, NSString *message, NSError *error) {
    rejections += 1;
    XCTAssertEqualObjects(code, @"firebase_unavailable");
    XCTAssertEqualObjects(message, @"Firebase is not configured");
    XCTAssertNil(error);
  };

  XCTAssertNoThrow(operation(module, resolve, reject));
  XCTAssertEqual(resolutions, 0u);
  XCTAssertEqual(rejections, 1u);
  XCTAssertNil([FIRApp defaultApp]);
}

- (void)testGetTokenWithoutFirebaseRejects
{
  [self assertUnavailableOperation:^(id<QuietFirebaseMessagingTesting> module, RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
    [module getToken:resolve rejecter:reject];
  }];
}

- (void)testDeleteTokenWithoutFirebaseRejects
{
  [self assertUnavailableOperation:^(id<QuietFirebaseMessagingTesting> module, RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
    [module deleteToken:resolve rejecter:reject];
  }];
}

- (void)testSubscribeWithoutFirebaseRejects
{
  [self assertUnavailableOperation:^(id<QuietFirebaseMessagingTesting> module, RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
    [module subscribeToTopic:@"quiet-native-regression" resolver:resolve rejecter:reject];
  }];
}

- (void)testUnsubscribeWithoutFirebaseRejects
{
  [self assertUnavailableOperation:^(id<QuietFirebaseMessagingTesting> module, RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
    [module unsubscribeFromTopic:@"quiet-native-regression" resolver:resolve rejecter:reject];
  }];
}

- (void)testAPNSTokenWithoutFirebaseDoesNotThrow
{
  UIApplication *application = UIApplication.sharedApplication;
  id<UIApplicationDelegate> delegate = application.delegate;
  SEL callback = @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:);
  XCTAssertTrue([delegate respondsToSelector:callback]);
  NSData *token = [NSMutableData dataWithLength:32];

  XCTAssertNoThrow([delegate application:application didRegisterForRemoteNotificationsWithDeviceToken:token]);
  XCTAssertNil([FIRApp defaultApp]);
}

@end
