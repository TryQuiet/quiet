import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { apply, call, delay, put, select } from 'typed-redux-saga';
import { getPublicChannelsDelay } from '../const/delays';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { IChannelInfo } from '../publicChannels.types';
import { publicChannelsActions } from '../publicChannels.slice';
import { navigateTo } from '../../../utils/functions/navigateTo/navigateTo';
import { ScreenNames } from '../../../const/ScreenNames.enum';

export function* getPublicChannelsSaga(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.GET_PUBLIC_CHANNELS]);
}

export function* loadPublicChannelsSaga(): Generator {
  let channels: IChannelInfo[] = [];
  while (true) {
    yield* put(publicChannelsActions.getPublicChannels());
    channels = yield* select(publicChannelsSelectors.publicChannels);
    if (channels.length > 0) {
      yield* call(navigateTo, ScreenNames.MainScreen);
      break;
    }
    yield* delay(getPublicChannelsDelay);
  }
}
