#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(TorModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startTor:(nonnull NSNumber)socksPort controlPort:(nonnull NSNumber)controlPort httpTunnelPort:(nonnull NSNumber)httpTunnelPort)
RCT_EXTERN_METHOD(createDataDirectory)

@end
