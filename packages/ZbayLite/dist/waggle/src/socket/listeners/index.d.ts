import IOProxy from '../IOProxy';
import SocketIO from 'socket.io';
declare const initListeners: (io: SocketIO.Server, ioProxy: IOProxy) => void;
export default initListeners;
