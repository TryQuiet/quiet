
#import <React/RCTBridgeModule.h>

@interface RNNodeJsMobile : NSObject <RCTBridgeModule>
  -(void) sendMessageToNode:(NSString*)channelName:(NSString*)message;
  -(void) sendMessageBackToReact:(NSString*)channelName:(NSString*)message;
  -(void) callStartNodeProject:(NSString *)input;
@end
  
