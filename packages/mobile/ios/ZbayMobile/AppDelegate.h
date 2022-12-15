#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <Tor/Tor.h>

#import "RNNodeJsMobile.h"

#import "ZbayMobile-Swift.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;

@property uint16_t dataPort;

@property (nonatomic, strong) TorHandler *tor;
@property (nonatomic, strong) TORConfiguration *torConfiguration;

- (void) getAuthCookieAndLaunchBackend:(uint16_t)controlPort:(uint16_t)httpTunnelPort;

@end
