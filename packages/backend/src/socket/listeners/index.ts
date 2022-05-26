import IOProxy from '../IOProxy'
import SocketIO from 'socket.io'
import { connections } from './connection'

const initListeners = (io: SocketIO.Server, ioProxy: IOProxy) => {
  connections(io, ioProxy)
}

export default initListeners
