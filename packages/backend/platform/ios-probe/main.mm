#import <UIKit/UIKit.h>
extern "C" int node_start(int argc, char *argv[]);
@interface SodiumProbe : UIResponder <UIApplicationDelegate>
@property(strong, nonatomic) UIWindow *window;
@end
@implementation SodiumProbe
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options {
  self.window = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
  self.window.rootViewController = [UIViewController new];
  self.window.rootViewController.view.backgroundColor = UIColor.whiteColor;
  [self.window makeKeyAndVisible];
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    char *program = strdup("node");
    char *script = strdup([[[NSBundle mainBundle].bundlePath stringByAppendingPathComponent:@"nodejs-project/probe.cjs"] UTF8String]);
    char *args[] = {program, script};
    node_start(2, args);
    free(script); free(program);
  });
  return YES;
}
@end
int main(int argc, char **argv) {
  @autoreleasepool { return UIApplicationMain(argc, argv, nil, NSStringFromClass([SodiumProbe class])); }
}
