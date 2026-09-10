#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

// Firebase imports
@import FirebaseCore;
@import FirebaseMessaging;

#import "RNNodeJsMobile.h"
#import "NodeRunner.hpp"
#import "Quiet-Swift.h"

@interface AppDelegate () <TorHandlerDelegate>
@property (nonatomic) BOOL backendReady;
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

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(backgroundTransitionFinished:)
                                               name:QuietBackgroundTransitionFinishedNotification
                                             object:nil];
  [self startTorAndBackend];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
};

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

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(backendDidBecomeReady:)
                                               name:QuietBackendReadyNotification
                                             object:nil];
  // Local storage and the frontend transport must work while Tor is unavailable.
  // The real authentication cookie is supplied later through rewireServices.
  [self launchBackend:controlPort httpTunnelPort:httpTunnelPort];

  // Spawn one Tor instance for the lifetime of this app process. App
  // background/foreground transitions switch it between DORMANT and ACTIVE.
  self.tor = [TorHandler new];
  self.tor.delegate = self;
  [self.tor startWithSocksPort:socksPort controlPort:controlPort httpTunnelPort:httpTunnelPort];
}

- (BOOL)applicationIsInBackground {
  // Delegate intent changes before UIKit necessarily updates applicationState.
  return [[[NodeRunner sharedInstance] backgroundTask] isBackground];
}

- (void)backendDidBecomeReady:(NSNotification *)notification {
  self.backendReady = YES;
  if ([self applicationIsInBackground]) {
    // Backgrounding during Node startup may have preceded its bridge listeners.
    // NodeRunner replays the authoritative system pause when backendReady arrives.
    [[[NodeRunner sharedInstance] backgroundTask] backendDidBecomeReady];
  } else {
    [self.nodeJsMobile sendMessageToNode:@"resume":@"app:resume"];
    // Request fresh readiness even if Tor's first callback preceded backendReady.
    [self.tor enterForeground];
  }
}

- (void)torHandlerReady:(TorHandler *)handler
            controlPort:(uint16_t)controlPort
         httpTunnelPort:(uint16_t)httpTunnelPort
             authCookie:(NSString *)authCookie
{
  (void)handler;

  // A readiness callback can race with a background transition. The next
  // foreground callback will request readiness again, so do nothing here.
  if (!self.backendReady || [self applicationIsInBackground]) {
    return;
  }

  [self rewireServices:controlPort httpTunnelPort:httpTunnelPort authCookie:authCookie];
}

- (void)launchBackend:(uint16_t)controlPort httpTunnelPort:(uint16_t)httpTunnelPort {
  self.nodeJsMobile = [RNNodeJsMobile new];
  [self.nodeJsMobile setSocketIOSecret:self.socketIOSecret];
  NSString *command = [NSString stringWithFormat:@"bundle.cjs --dataPort %hu --dataPath %@ --controlPort %hu --httpTunnelPort %hu --platform %@", self.dataPort, self.dataPath, controlPort, httpTunnelPort, platform];
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
  QuietBackgroundTask *task = [[NodeRunner sharedInstance] backgroundTask];
  if (task.isBackground) return;
  NSString *transition = [task beginTransition];
  QuietSetAppForegroundFlag(NO);

  if (self.tor) {
    [self.tor enterBackgroundWithTransitionId:transition completion:^(BOOL success) {
      [task acknowledgeTransition:transition participant:@"native" success:success];
    }];
    if (![[task pendingTransitionsForParticipant:@"native"] containsObject:transition]) {
      [self.tor cancelBackgroundTransition:transition];
    }
  } else {
    [task acknowledgeTransition:transition participant:@"native" success:YES];
  }

  // Module setup/event delivery is deferred so this delegate returns promptly.
  // If the bridge is still starting, JS readiness replays the pending flush.
  dispatch_async(dispatch_get_main_queue(), ^{
    [[self.bridge moduleForName:@"CommunicationModule"] appPause:transition];
  });
}

- (void)backgroundTransitionFinished:(NSNotification *)notification {
  // Expiration drops callback storage without changing Tor's latest intent.
  [self.tor cancelBackgroundTransition:notification.userInfo[@"transitionId"]];
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [[[NodeRunner sharedInstance] backgroundTask] enterForeground];
  QuietSetAppForegroundFlag(YES);
  // Resume non-Tor services immediately. Tor supplies credentials separately.
  [self.nodeJsMobile sendMessageToNode:@"resume":@"app:resume"];
  // Preserve callback order and avoid replaying an old resume after a newer pause.
  dispatch_async(dispatch_get_main_queue(), ^{
    if (![[[NodeRunner sharedInstance] backgroundTask] isBackground]) {
      [[self.bridge moduleForName:@"CommunicationModule"] appResume];
    }
  });

  [self.tor enterForeground];
}

- (void)applicationWillTerminate:(UIApplication *)application
{
  [self.tor shutdown];
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feture is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  // Switch this bool to turn on and off the concurrent root
  return true;
}

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = [NSMutableDictionary new];

#ifdef RCT_NEW_ARCH_ENABLED
  initProps[kRNConcurrentRoot] = @([self concurrentRootEnabled]);
#endif

  return initProps;
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

#if RCT_NEW_ARCH_ENABLED

#pragma mark - RCTCxxBridgeDelegate

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                             delegate:self
                                                            jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#endif

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
