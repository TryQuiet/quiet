import IOProxy from '../IOProxy'
import SocketIO from 'socket.io'
import { connections } from './connection'
import { EventEmitter } from 'events'

const initListeners = (io: SocketIO.Server, ioProxy: IOProxy, connectionManager: EventEmitter) => {
  connections(io, ioProxy, connectionManager)
}

export default initListeners
