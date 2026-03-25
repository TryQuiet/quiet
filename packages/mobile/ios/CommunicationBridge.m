#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(CommunicationModule, RCTEventEmitter)
RCT_EXTERN_METHOD(handleIncomingEvents:(NSString *)event payload:(NSString *)payload extra:(NSString *)extra)
RCT_EXTERN_METHOD(requestNotificationPermission)
RCT_EXTERN_METHOD(checkNotificationPermission)
RCT_EXTERN_METHOD(saveKeysInKeychain:(NSArray *)newKeys)
RCT_EXTERN_METHOD(saveUserMetadata:(NSArray *)updatedMetadata)
RCT_EXTERN_METHOD(saveDeviceCredentials:(NSString *)deviceId teamId:(NSString *)teamId signingPrivateKey:(NSString *)signingPrivateKey)
@end
