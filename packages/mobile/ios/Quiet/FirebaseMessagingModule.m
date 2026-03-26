#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FirebaseMessagingModule, NSObject)

RCT_EXTERN_METHOD(getToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(subscribeToTopic:(NSString *)topic
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(unsubscribeFromTopic:(NSString *)topic
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setEncryptionKey:(NSString *)key)

@end
