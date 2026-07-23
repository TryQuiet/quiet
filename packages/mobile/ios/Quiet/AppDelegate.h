#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

#import "RNNodeJsMobile.h"

// Forward declarations for Swift classes
// (Actual imports happen in AppDelegate.m to avoid circular dependencies)
@class TorHandler;

@interface AppDelegate : RCTAppDelegate <UNUserNotificationCenterDelegate>

@property (nonatomic) uint16_t dataPort;

@property (nonatomic, strong) NSString *socketIOSecret;

@property (nonatomic, strong) NSString *dataPath;

@property (nonatomic, strong) RNNodeJsMobile *nodeJsMobile;

@property (nonatomic, strong) TorHandler *tor;

@end
