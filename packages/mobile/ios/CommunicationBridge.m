#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(CommunicationModule, RCTEventEmitter)
RCT_EXTERN_METHOD(handleIncomingEvents:(NSString *)event payload:(NSString *)payload extra:(NSString *)extra)
@end
