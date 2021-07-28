import { NativeModules, Platform } from 'react-native';
import { put, call } from 'typed-redux-saga';
import { initActions } from '../../init/init.slice';

export function* startTorSaga(): Generator {
  yield* put(
    initActions.updateInitDescription('Tor initialization in progress'),
  );
  if (Platform.OS === 'android') {
    yield* call(initAndroidServices);
  }
}

export const initAndroidServices = () => {
  NativeModules.Integrator.initAndroidServices();
};
