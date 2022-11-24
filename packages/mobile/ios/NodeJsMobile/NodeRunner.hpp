#ifndef NodeRunner_hpp
#define NodeRunner_hpp
#import <Foundation/Foundation.h>
#import "RNNodeJsMobile.h"

@interface NodeRunner : NSObject
{
  bool _startedNodeAlready;
}
+ (NodeRunner*) sharedInstance;
- (void) startEngineWithArguments:(NSArray*)arguments:(NSString*)builtinModulesPath;
- (void) setCurrentRNNodeJsMobile:(RNNodeJsMobile*)module;
- (void) sendMessageToNode:(NSString*)channelName:(NSString*)message;
- (void) sendMessageBackToReact:(NSString*)channelName:(NSString*)message;
@property(assign, nonatomic, readwrite) bool startedNodeAlready;
@end

#endif
