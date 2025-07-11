
#import <React/RCTBridgeModule.h>

@interface RNNodeJsMobile : NSObject <RCTBridgeModule>
  @property (nonatomic, strong) NSString *socketIOSecret;
  -(void) sendMessageToNode:(NSString*)event:(NSString*)message;
  -(void) sendMessageBackToReact:(NSString*)channelName:(NSString*)message;
  -(void) callStartNodeProject:(NSString *)input;
@end
