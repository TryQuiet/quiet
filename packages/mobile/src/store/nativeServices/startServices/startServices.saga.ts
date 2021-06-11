import { NativeModules } from 'react-native';
import { put, call } from 'typed-redux-saga';
import { assetsActions } from '../../assets/assets.slice';
import { initActions } from '../../init/init.slice';
import { InitCheckKeys } from '../../init/initCheck.keys';

export function* startServicesSaga(): Generator {
  yield* put(
    assetsActions.setDownloadHint(
      'Setting up software that will take care of your chats',
    ),
  );
  yield* put(
    initActions.updateInitCheck({
      event: InitCheckKeys.NativeServices,
      passed: true,
    }),
  );
  yield* call(initAndroidServices);
}

export const initAndroidServices = () => {
  NativeModules.Integrator.initAndroidServices();
};
