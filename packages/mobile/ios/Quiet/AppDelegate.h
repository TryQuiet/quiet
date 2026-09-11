#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

#import "RNNodeJsMobile.h"

// Forward declarations for Swift classes
// (Actual imports happen in AppDelegate.mm to avoid circular dependencies)
@class TorHandler;

@interface AppDelegate : RCTAppDelegate <UNUserNotificationCenterDelegate>

@property (nonatomic) uint16_t dataPort;

@property (nonatomic, strong) NSString *socketIOSecret;

@property (nonatomic, strong) NSString *dataPath;

@property (nonatomic, strong) RNNodeJsMobile *nodeJsMobile;

@property (nonatomic, strong) TorHandler *tor;

// Resolve the current React Native instance's module in either architecture.
@property (nonatomic, readonly, nullable) id communicationModule;

@end
