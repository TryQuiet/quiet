import { io, Socket } from 'socket.io-client';
import { put, call, fork } from 'typed-redux-saga';
import { socket } from '@zbayapp/nectar';
import config from './config';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';
import { nativeServicesActions } from '../../nativeServices/nativeServices.slice';

export function* startConnectionSaga(): Generator {
  const _socket = yield* call(connect);
  // There is a type-specific problem with passing Socket object between this saga and @zbayapp/nectar
  // @ts-ignore
  yield* fork(socket.useIO, _socket);
  //
  yield* put(nativeServicesActions.initPushNotifications());
  //
  yield* call(replaceScreen, ScreenNames.MainScreen);
}

export const connect = async (): Promise<Socket> => {
  const socket = io(config.socket.address);
  return await new Promise(resolve => {
    socket.on('connect', async () => {
      resolve(socket);
    });
  });
};
