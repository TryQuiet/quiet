import { Socket } from 'socket.io-client';
import { apply, delay, put, select } from 'typed-redux-saga';
import { SocketActionTypes } from '../../actionTypes';
import { getPublicChannelsDelay } from '../../delays';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { IChannelInfo } from '../publicChannels.types';
import { publicChannelsActions } from '../publicChannels.slice';

export function* getPublicChannelsSaga(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.GET_PUBLIC_CHANNELS]);
}

export function* loadPublicChannelsSaga(): Generator {
  console.log('NECTAR: loadPublicChannelsSaga');
  let channels: IChannelInfo[] = [];
  while (true) {
    console.log('inside nectar while true loop');
    yield* put(publicChannelsActions.getPublicChannels());
    channels = yield* select(publicChannelsSelectors.publicChannels);
    if (channels.length > 0) {
      break;
    }
    yield* delay(getPublicChannelsDelay);
  }
}
