import {StoreKeys} from '../store.keys';
import {selectorsFactory} from '../store.utils';
import {SocketState} from './socket.slice';

export const socketSelectors = selectorsFactory(StoreKeys.Socket, SocketState);
