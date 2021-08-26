#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(TorModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startTor:(NSNumber)socksPort controlPort:(NSNumber)controlPort)
RCT_EXTERN_METHOD(startHiddenService:(NSNumber)port key:(NSString)key)
RCT_EXTERN_METHOD(createDataDirectory)

@end
