import IOProxy from '../IOProxy'
import SocketIO from 'socket.io'
import { connections } from './connection'
import { ConnectionsManager } from '../../libp2p/connectionsManager'

const initListeners = (io: SocketIO.Server, ioProxy: IOProxy, connectionManager: ConnectionsManager) => {

  connections(io, ioProxy, connectionManager)
}

export default initListeners
