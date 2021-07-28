import { PayloadAction } from '@reduxjs/toolkit';
import { NativeModules, Platform } from 'react-native';
import { put, call } from 'typed-redux-saga';
import { checkLibsVersionSaga } from '../../assets/checkLibsVersion/checkLibsVersion.saga';
import { checkWaggleVersionSaga } from '../../assets/checkWaggleVersion/checkWaggleVersion.saga';
import { initActions } from '../../init/init.slice';
import { nativeServicesActions } from '../nativeServices.slice';

export function* startWaggleSaga(
  action: PayloadAction<
    ReturnType<typeof nativeServicesActions.startWaggle>['payload']
  >,
): Generator {
  if (Platform.OS === 'android') {
    yield* checkLibsVersionSaga();
    yield* checkWaggleVersionSaga();

    yield* put(
      initActions.updateInitDescription(
        'Data is being retrieved from a distributed database',
      ),
    );

    yield* call(() => {
      NativeModules.Integrator.startWaggle(action.payload);
    });
  }
}
