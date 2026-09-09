#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTModuleRegistry.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
// RCTHost exposes C++ runtime types, so this AppDelegate is compiled as Objective-C++.
#import <ReactCommon/RCTHost.h>

// Firebase imports
@import FirebaseCore;
@import FirebaseMessaging;

#import "RNNodeJsMobile.h"
#import "Quiet-Swift.h"

@interface AppDelegate () <TorHandlerDelegate>
@end

@implementation AppDelegate

static NSString *const platform = @"mobile";
static NSString *const QuietAppGroupIdentifier = @"group.com.quietmobile";
static NSString *const QuietAppIsForegroundKey = @"quiet.app.isForeground";

static void QuietSetAppForegroundFlag(BOOL isForeground) {
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:QuietAppGroupIdentifier];
  if (defaults == nil) {
    defaults = [NSUserDefaults standardUserDefaults];
  }
  [defaults setBool:isForeground forKey:QuietAppIsForegroundKey];
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  QuietSetAppForegroundFlag(YES);
  self.moduleName = @"QuietMobile";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Set notification center delegate
  [UNUserNotificationCenter currentNotificationCenter].delegate = self;

  // Configure Firebase
  [self configureFirebase];

  [CommunicationModule performFreshInstallCleanupIfNeeded];

  // Call only once per nodejs thread
  [self createDataDirectory];

  [self startTorAndBackend];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
};

- (id)communicationModule
{
  // Bridgeless React Native owns modules through its host, leaving self.bridge nil.
  // Always resolve the managed instance so its event emitter is attached to JS.
  RCTModuleRegistry *registry = self.rootViewFactory.reactHost.moduleRegistry;
  if (registry != nil) {
    return (CommunicationModule *)[registry moduleForName:"CommunicationModule"];
  }
  return (CommunicationModule *)[self.bridge moduleForName:@"CommunicationModule"];
}

- (void) createDataDirectory {
  DataDirectory *dataDirectory = [DataDirectory new];
  self.dataPath = [dataDirectory create];
}

- (void) startTorAndBackend {
  if (self.tor != nil) {
    [self.tor enterForeground];
    return;
  }

  // Find ports to use in Tor and backend configuration.

  Utils *utils = [Utils new];

  if (self.socketIOSecret == nil) {
      self.socketIOSecret = [utils generateSecretWithLength:(20)];
  }

  FindFreePort *findFreePort = [FindFreePort new];

  self.dataPort             = [findFreePort getFirstStartingFromPort:11000];

  WebsocketSingleton *websocket = [WebsocketSingleton sharedInstance];
  websocket.socketPort      = self.dataPort;
  websocket.socketIOSecret  = self.socketIOSecret;

  uint16_t socksPort        = [findFreePort getFirstStartingFromPort:arc4random_uniform(65000 - 1024) + 1024];
  uint16_t controlPort      = [findFreePort getFirstStartingFromPort:arc4random_uniform(65000 - 1024) + 1024];
  uint16_t httpTunnelPort   = [findFreePort getFirstStartingFromPort:arc4random_uniform(65000 - 1024) + 1024];


  // Spawn one Tor instance for the lifetime of this app process. App
  // background/foreground transitions switch it between DORMANT and ACTIVE.
  self.tor = [TorHandler new];
  self.tor.delegate = self;
  [self.tor startWithSocksPort:socksPort controlPort:controlPort httpTunnelPort:httpTunnelPort];
}

- (void)torHandlerReady:(TorHandler *)handler
            controlPort:(uint16_t)controlPort
         httpTunnelPort:(uint16_t)httpTunnelPort
             authCookie:(NSString *)authCookie
{
  (void)handler;

  // A readiness callback can race with a background transition. The next
  // foreground callback will request readiness again, so do nothing here.
  if ([UIApplication sharedApplication].applicationState == UIApplicationStateBackground) {
    return;
  }

  if (self.nodeJsMobile == nil) {
    [self launchBackend:controlPort httpTunnelPort:httpTunnelPort authCookie:authCookie];
  } else {
    [self rewireServices:controlPort httpTunnelPort:httpTunnelPort authCookie:authCookie];
  }
}

- (void)launchBackend:(uint16_t)controlPort httpTunnelPort:(uint16_t)httpTunnelPort authCookie:(NSString *)authCookie {
  self.nodeJsMobile = [RNNodeJsMobile new];
  [self.nodeJsMobile setSocketIOSecret:self.socketIOSecret];
  NSString *command = [NSString stringWithFormat:@"bundle.cjs --dataPort %hu --dataPath %@ --controlPort %hu --httpTunnelPort %hu --authCookie %@ --platform %@", self.dataPort, self.dataPath, controlPort, httpTunnelPort, authCookie, platform];
  [self.nodeJsMobile startNodeProjectInBackground:command];
}

- (void)rewireServices:(uint16_t)controlPort httpTunnelPort:(uint16_t)httpTunnelPort authCookie:(NSString *)authCookie {
  NSString * dataPortPayload = [NSString stringWithFormat:@"%@:%hu", @"socketIOPort", self.dataPort];
  NSString * socketIOSecretPayload = [NSString stringWithFormat:@"%@:%@", @"socketIOSecret", self.socketIOSecret];
  NSString * controlPortPayload = [NSString stringWithFormat:@"%@:%hu", @"torControlPort", controlPort];
  NSString * httpTunnelPortPayload = [NSString stringWithFormat:@"%@:%hu", @"httpTunnelPort", httpTunnelPort];
  NSString * authCookiePayload = [NSString stringWithFormat:@"%@:%@", @"authCookie", authCookie];

  NSString * payload = [NSString stringWithFormat:@"%@|%@|%@|%@|%@", dataPortPayload, socketIOSecretPayload, controlPortPayload, httpTunnelPortPayload, authCookiePayload];
  [self.nodeJsMobile sendMessageToNode:@"open":payload];
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  QuietSetAppForegroundFlag(NO);
  [self.tor enterBackground];

  NSString * message = [NSString stringWithFormat:@"app:close"];
  [self.nodeJsMobile sendMessageToNode:@"close":message];

  // Flush persistor before app goes idle
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSTimeInterval delayInSeconds = 0;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
      [self.communicationModule appPause];
    });
  });
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  QuietSetAppForegroundFlag(YES);
  // Display splash screen until services become available again
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSTimeInterval delayInSeconds = 0;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
      [self.communicationModule appResume];
    });
  });

  [self.tor enterForeground];
}

- (void)applicationWillTerminate:(UIApplication *)application
{
  [self.tor shutdown];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

#pragma mark - Push Notification Registration

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  // Forward APNS token to Firebase Messaging so it can generate an FCM token,
  // which will be delivered via the MessagingDelegate in AppDelegate+Firebase.swift
  [FIRMessaging.messaging setAPNSToken:deviceToken type:FIRMessagingAPNSTokenTypeUnknown];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  NSLog(@"Failed to register for remote notifications: %@", error.localizedDescription);
}

@end
