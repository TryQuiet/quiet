import { Socket } from 'socket.io-client';
import { all, call, takeEvery } from 'typed-redux-saga';
import { appImages } from '../../../assets';
import { ScreenNames } from '../../const/ScreenNames.enum';
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen';
import { createUserCsrSaga } from './createUserCsr/createUserCsr.saga';
import { handleIdentityError } from './handleIdentityError/handleIdentityError.saga';
import { identityActions } from './identity.slice';
import { registerCertificateSaga } from './registerCertificate/registerCertificate.saga';
import { registerUsernameSaga } from './registerUsername/registerUsername.saga';

export function* identityMasterSaga(socket: Socket): Generator {
  yield all([
    takeEvery(identityActions.registerUsername.type, registerUsernameSaga),
    takeEvery(identityActions.createUserCsr.type, createUserCsrSaga),
    takeEvery(
      identityActions.storeUserCsr.type,
      registerCertificateSaga,
      socket,
    ),
    takeEvery(identityActions.storeUserCertificate.type, function* () {
      yield* call(replaceScreen, ScreenNames.SuccessScreen, {
        onPress: () => {
          replaceScreen(ScreenNames.MainScreen);
        },
        icon: appImages.username_registered,
        title: 'You created a username',
        message: 'Your username will be registered shortly',
      });
    }),
    takeEvery(identityActions.throwIdentityError.type, handleIdentityError),
  ]);
}
