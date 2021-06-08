import { NativeModules } from 'react-native';
import { call } from 'typed-redux-saga';

export function* startServicesSaga(): Generator {
  yield* call(initAndroidServices);
}

export const initAndroidServices = () => {
  NativeModules.Integrator.initAndroidServices();
};
