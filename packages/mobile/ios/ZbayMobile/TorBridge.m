#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(TorModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startTor:(NSNumber)socksPort controlPort:(NSNumber)controlPort httpTunnelPort:(NSNumber)httpTunnelPort)
RCT_EXTERN_METHOD(createDataDirectory)

@end
