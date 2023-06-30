#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import <React/RCTAppSetupUtils.h>

#import <React/RCTLinkingManager.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <react/config/ReactNativeConfig.h>

#import "RNNodeJsMobile.h"

#import "Quiet-Swift.h"


static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@interface AppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate> {
  RCTTurboModuleManager *_turboModuleManager;
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end
#endif

@implementation AppDelegate

static NSString *const platform = @"mobile";

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
  RCTAppSetupPrepareApp(application, false);

  self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

#if RCT_NEW_ARCH_ENABLED
  _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
  _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
  _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
  _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge contextContainer:_contextContainer];
  bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
#endif

  NSDictionary *initProps = [self prepareInitialProps];
  UIView *rootView = RCTAppSetupDefaultRootView(self.bridge, @"QuietMobile", initProps, false);

  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  // Call only once per nodejs thread
  [self createDataDirectory];
  
  [self spinupBackend:true];
  
  return YES;
};

- (void) createDataDirectory {
  DataDirectory *dataDirectory = [DataDirectory new];
  self.dataPath = [dataDirectory create];
}

- (void) initWebsocketConnection {
  FindFreePort *findFreePort = [FindFreePort new];
  self.dataPort = [findFreePort getFirstStartingFromPort:11000];

  /*
   * We have to wait for RCTBridge listeners to be initialized, yet we must be sure to deliver the event containing data port information.
   * Delay used below can't cause any race condition as websocket won't connect until data server starts listening anyway.
   */
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSTimeInterval delayInSeconds = 0; // 7.0
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
    dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
      [[self.bridge moduleForName:@"CommunicationModule"] sendDataPortWithPort:self.dataPort];
    });
  });
}

- (void) spinupBackend:(BOOL)init {
  
  // (1/7) Find ports to use in tor configuration
  
  FindFreePort *findFreePort = [FindFreePort new];
    
  uint16_t socksPort        = [findFreePort getFirstStartingFromPort:12000];
  uint16_t controlPort      = [findFreePort getFirstStartingFromPort:14000];
  uint16_t httpTunnelPort   = [findFreePort getFirstStartingFromPort:16000];
    
  
  // (2/7) Spawn tor with proper configuration
  
  self.tor = [TorHandler new];
    
  self.torConfiguration = [self.tor getTorConfiguration:socksPort controlPort:controlPort httpTunnelPort:httpTunnelPort];
  
  [self.tor removeOldAuthCookieWithConfiguration:self.torConfiguration];
  
  [self.tor spawnWithConfiguration:self.torConfiguration];
  
  
  // (3/7) Wait for tor to initialize
  
  NSTimeInterval delayInSeconds = 7.0;
  dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
  dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
      
    
    // (4/7) Connect to tor control port natively (so we can use it to shutdown tor when app goes idle)
    
    NSString *authCookie = [self getAuthCookie];
      
    self.torController = [[TORController alloc] initWithSocketHost:@"127.0.0.1" port:controlPort];
      
    NSError *error = nil;
    BOOL connected = [self.torController connect:&error];
      
    NSLog(@"Tor control port error %@", error);
          
    NSData *authCookieData = [authCookie dataUsingEncoding:NSUTF8StringEncoding];
    [self.torController authenticateWithData:authCookieData completion:^(BOOL success, NSError * _Nullable error) {
      NSString *res = success ? @"YES" : @"NO";
      NSLog(@"Tor control port auth success %@", res);
      NSLog(@"Tor control port auth error %@", error);
    }];
      
    
    // (5/7) Update data port information and broadcast it to frontend
    
    [self initWebsocketConnection];
    
    
    // (7/7) Launch backend or reviwe services
      
    if (init) {
      [self launchBackend:controlPort :httpTunnelPort :authCookie];
    } else {
      [self reviweServices:controlPort];
    }
  });
}

- (NSString *) getAuthCookie {
  NSString *authCookie = [self.tor getAuthCookieWithConfiguration:self.torConfiguration];
  
  while (authCookie == nil) {
    authCookie = [self.tor getAuthCookieWithConfiguration:self.torConfiguration];
  };
  
  return authCookie;
}

- (void) launchBackend:(uint16_t)controlPort:(uint16_t)httpTunnelPort:(NSString *)authCookie {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    self.nodeJsMobile = [RNNodeJsMobile new];
    [self.nodeJsMobile callStartNodeProject:[NSString stringWithFormat:@"bundle.cjs --dataPort %hu --dataPath %@ --controlPort %hu --httpTunnelPort %hu --authCookie %@ --platform %@", self.dataPort, self.dataPath, controlPort, httpTunnelPort, authCookie, platform]];
  });
}

- (void) reviweServices:(uint16_t)controlPort {
  NSString * message = [NSString stringWithFormat:@"dataPort:%hu|controlPort:%hu", self.dataPort, controlPort];
  [self.nodeJsMobile sendMessageToNode:@"open":message];
}

- (void) stopTor {
  NSLog(@"Sending SIGNAL SHUTDOWN on Tor control port %d", (int)[self.torController isConnected]);
  [self.torController sendCommand:@"SIGNAL SHUTDOWN" arguments:nil data:nil observer:^BOOL(NSArray<NSNumber *> *codes, NSArray<NSData *> *lines, BOOL *stop) {
    NSUInteger code = codes.firstObject.unsignedIntegerValue;
    
    NSLog(@"Tor control port response code %lu", (unsigned long)code);
    
    if (code != TORControlReplyCodeOK && code != TORControlReplyCodeBadAuthentication)
      return NO;

    NSString *message = lines.firstObject ? [[NSString alloc] initWithData:(NSData * _Nonnull)lines.firstObject encoding:NSUTF8StringEncoding] : @"";
    
    NSLog(@"Tor control port response message %@", message);
    
    NSDictionary<NSString *, NSString *> *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:message, NSLocalizedDescriptionKey, nil];
    BOOL success = (code == TORControlReplyCodeOK && [message isEqualToString:@"OK"]);

    *stop = YES;
    return YES;
  }];
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  [self stopTor];
  
  NSString * message = [NSString stringWithFormat:@""];
  [self.nodeJsMobile sendMessageToNode:@"close":message];
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  // TODO: Block the UI until done
  [self spinupBackend:false];
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

@end
