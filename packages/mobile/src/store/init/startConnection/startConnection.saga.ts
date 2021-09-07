import { io, Socket } from 'socket.io-client';
import { call, fork } from 'typed-redux-saga';
import { socket } from '@zbayapp/nectar';
import config from './config';
import { ScreenNames } from '../../../const/ScreenNames.enum';
import { replaceScreen } from '../../../utils/functions/replaceScreen/replaceScreen';

export function* startConnectionSaga(): Generator {
  const _socket = yield* call(connect);
  // yield* put(nativeServicesActions.initPushNotifications());
  // There is a type-specific problem with passing Socket object between this saga and @zbayapp/nectar
  // @ts-ignore
  yield* fork(socket.useIO, _socket);
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
