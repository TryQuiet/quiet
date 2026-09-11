#import "QuietBackgroundTask.h"

NSNotificationName const QuietBackgroundTransitionFinishedNotification = @"QuietBackgroundTransitionFinished";

@implementation QuietBackgroundTask {
  NSUInteger _invalidTask;
  NSUInteger _task;
  NSUInteger _taskGeneration;
  BOOL _startingTask;
  BOOL _background;
  BOOL _backendReady;
  BOOL _backendPauseSent;
  NSString *_currentTransition;
  NSMutableDictionary<NSString *, NSMutableSet<NSString *> *> *_pending;
  NSUInteger (^_beginTask)(void (^)(void));
  void (^_endTask)(NSUInteger);
  void (^_sendBackendPause)(NSString *);
}

- (instancetype)initWithInvalidTask:(NSUInteger)invalidTask
                         beginTask:(NSUInteger (^)(void (^)(void)))beginTask
                           endTask:(void (^)(NSUInteger))endTask
                  sendBackendPause:(void (^)(NSString *))sendBackendPause {
  if ((self = [super init])) {
    _invalidTask = invalidTask;
    _task = invalidTask;
    _beginTask = [beginTask copy];
    _endTask = [endTask copy];
    _sendBackendPause = [sendBackendPause copy];
    _pending = [NSMutableDictionary dictionary];
  }
  return self;
}

- (BOOL)isBackground { return _background; }

- (NSString *)beginTransition {
  NSAssert([NSThread isMainThread], @"Background transitions belong to the main queue");
  if (_background) return _currentTransition;
  _background = YES;
  _backendPauseSent = NO;
  _currentTransition = [NSUUID UUID].UUIDString;
  NSString *transition = _currentTransition;
  _pending[transition] = [NSMutableSet setWithArray:@[@"backend", @"persistence", @"native"]];

  // Rapid reversals share the existing assertion; every in-flight transition
  // keeps its own acknowledgments. An old callback cannot finish a new one.
  if (_task == _invalidTask && !_startingTask) {
    NSUInteger generation = ++_taskGeneration;
    _startingTask = YES;
    __weak QuietBackgroundTask *weakSelf = self;
    NSUInteger task = _beginTask(^{
      [weakSelf expireGeneration:generation];
    });
    _startingTask = NO;
    if (generation != _taskGeneration || _pending.count == 0) {
      // Also safe for a provider that expires synchronously during begin.
      if (task != _invalidTask) _endTask(task);
    } else if (task == _invalidTask) {
      NSLog(@"Background task unavailable; transition=%@", transition);
      [self expireGeneration:generation];
    } else {
      _task = task;
    }
  }
  [self sendCurrentBackendPauseIfReady];
  return transition;
}

- (void)backendDidBecomeReady {
  NSAssert([NSThread isMainThread], @"Backend readiness belongs to the main queue");
  _backendReady = YES;
  [self sendCurrentBackendPauseIfReady];
}

- (void)sendCurrentBackendPauseIfReady {
  if (!_background || !_backendReady || _backendPauseSent) return;
  // Set before sending: a synchronous test/native callback may reenter.
  _backendPauseSent = YES;
  _sendBackendPause(_currentTransition);
}

- (void)enterForeground {
  NSAssert([NSThread isMainThread], @"Foreground transitions belong to the main queue");
  _background = NO;
  NSString *previous = _currentTransition;
  _currentTransition = nil;
  // Nothing was sent while Node was starting. Do not replay this pause when
  // backendReady arrives after a newer foreground request.
  if (previous && !_backendPauseSent) {
    [self acknowledgeTransition:previous participant:@"backend" success:NO];
  }
}

- (NSArray<NSString *> *)pendingTransitionsForParticipant:(NSString *)participant {
  NSAssert([NSThread isMainThread], @"Acknowledgments belong to the main queue");
  NSMutableArray *transitions = [NSMutableArray array];
  for (NSString *transition in _pending) {
    if ([_pending[transition] containsObject:participant]) [transitions addObject:transition];
  }
  return transitions;
}

- (void)acknowledgeTransition:(NSString *)transition
                 participant:(NSString *)participant
                     success:(BOOL)success {
  NSAssert([NSThread isMainThread], @"Acknowledgments belong to the main queue");
  NSMutableSet *participants = _pending[transition];
  if (![participants containsObject:participant]) return;
  if (!success) NSLog(@"Background participant failed or superseded; transition=%@ participant=%@", transition, participant);
  [participants removeObject:participant];
  if (participants.count == 0) {
    [_pending removeObjectForKey:transition];
    // Invalidate ownership before notifying observers, which may reenter.
    if (_pending.count == 0) [self endTask];
    [self notifyFinished:transition];
  }
}

- (void)expireGeneration:(NSUInteger)generation {
  NSAssert([NSThread isMainThread], @"UIKit expiration belongs to the main queue");
  if (generation != _taskGeneration) return;
  NSArray *transitions = _pending.allKeys;
  for (NSString *transition in transitions) {
    NSArray *missing = [[_pending[transition] allObjects] sortedArrayUsingSelector:@selector(compare:)];
    NSLog(@"Background task expired; transition=%@ missing=%@", transition, [missing componentsJoinedByString:@","]);
  }
  [_pending removeAllObjects];
  [self endTask];
  for (NSString *transition in transitions) [self notifyFinished:transition];
}

- (void)endTask {
  NSUInteger task = _task;
  _task = _invalidTask;
  ++_taskGeneration;
  if (task != _invalidTask) _endTask(task);
}

- (void)notifyFinished:(NSString *)transition {
  [[NSNotificationCenter defaultCenter] postNotificationName:QuietBackgroundTransitionFinishedNotification
                                                    object:self
                                                  userInfo:@{@"transitionId": transition}];
}
@end
