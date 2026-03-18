#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <Tor/Tor.h>
#import <UserNotifications/UserNotifications.h>

#import "RNNodeJsMobile.h"

#import "Quiet-Swift.h"

@interface AppDelegate : RCTAppDelegate <UNUserNotificationCenterDelegate>

@property uint16_t dataPort;

@property NSString *socketIOSecret;

@property NSString *dataPath;

@property RNNodeJsMobile *nodeJsMobile;

@property (nonatomic, strong) TorHandler *tor;
@property (nonatomic, strong) TORConfiguration *torConfiguration;
@property (nonatomic, strong) TORController *torController;

@end
