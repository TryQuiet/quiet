#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <Tor/Tor.h>
#import <UserNotifications/UserNotifications.h>

#import "RNNodeJsMobile.h"

// Forward declarations for Swift classes
// (Actual imports happen in AppDelegate.m to avoid circular dependencies)
@class TorHandler;
@class TORConfiguration;
@class TORController;

@interface AppDelegate : RCTAppDelegate <UNUserNotificationCenterDelegate>

@property (nonatomic) uint16_t dataPort;

@property (nonatomic, strong) NSString *socketIOSecret;

@property (nonatomic, strong) NSString *dataPath;

@property (nonatomic, strong) RNNodeJsMobile *nodeJsMobile;

@property (nonatomic, strong) TorHandler *tor;
@property (nonatomic, strong) TORConfiguration *torConfiguration;
@property (nonatomic, strong) TORController *torController;

@end
