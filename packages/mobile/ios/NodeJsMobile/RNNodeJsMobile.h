
#import <React/RCTBridgeModule.h>

@interface RNNodeJsMobile : NSObject <RCTBridgeModule>
  -(void) sendMessageBackToReact:(NSString*)channelName:(NSString*)message;
  -(void) callStartNodeProjectWithArgs:(NSString *)input;
@end
  
