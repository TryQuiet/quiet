#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSNotificationName const QuietBackgroundTransitionFinishedNotification;

/// Main-queue state machine. UIKit ownership is injected so the same code can
/// be tested without launching the app, Node, or Tor.
@interface QuietBackgroundTask : NSObject
- (instancetype)initWithInvalidTask:(NSUInteger)invalidTask
                         beginTask:(NSUInteger (^)(void (^expiration)(void)))beginTask
                           endTask:(void (^)(NSUInteger task))endTask
                  sendBackendPause:(void (^)(NSString *transitionID))sendBackendPause;
- (NSString *)beginTransition;
- (void)enterForeground;
- (void)backendDidBecomeReady;
- (void)acknowledgeTransition:(NSString *)transitionID
                 participant:(NSString *)participant
                     success:(BOOL)success NS_SWIFT_NAME(acknowledge(_:participant:success:));
- (NSArray<NSString *> *)pendingTransitionsForParticipant:(NSString *)participant;
@property (nonatomic, readonly, getter=isBackground) BOOL background;
@end

NS_ASSUME_NONNULL_END
