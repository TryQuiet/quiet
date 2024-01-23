#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <Tor/Tor.h>

#import "RNNodeJsMobile.h"

#import "Quiet-Swift.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

@property uint16_t dataPort;

@property NSString *socketIOSecret;

@property NSString *dataPath;

@property RCTBridge *bridge;

@property RNNodeJsMobile *nodeJsMobile;

@property (nonatomic, strong) TorHandler *tor;
@property (nonatomic, strong) TORConfiguration *torConfiguration;
@property (nonatomic, strong) TORController *torController;

@end
