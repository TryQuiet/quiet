import { eventChannel } from 'redux-saga';
import { call, put, take } from 'typed-redux-saga';
import { initActions, TorData } from '../../init/init.slice';
import { NativeEventKeys } from './nativeEvent.keys';
import nativeEventEmitter from './nativeEventEmitter';

export function* nativeServicesCallbacksSaga(): Generator {
  const channel = yield* call(deviceEvents);
  while (true) {
    const action = yield* take(channel);
    yield put(action);
  }
}

export const deviceEvents = () => {
  return eventChannel<
    | ReturnType<typeof initActions.onTorInit>
    | ReturnType<typeof initActions.onDataDirectoryCreated>
  >(emit => {
    const subscriptions = [
      nativeEventEmitter?.addListener(
        NativeEventKeys.TorInit,
        (data: TorData) => {
          emit(initActions.onTorInit(data));
        },
      ),
      nativeEventEmitter?.addListener(
        NativeEventKeys.OnDataDirectoryCreated,
        (path: string) => emit(initActions.onDataDirectoryCreated(path)),
      ),
    ];
    return () => {
      subscriptions.forEach(subscription => subscription?.remove());
    };
  });
};
