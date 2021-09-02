import IOProxy from '../IOProxy'
import { connections } from './connection'

const initListeners = (io: SocketIO.Server, ioProxy: IOProxy) => {
  connections(io, ioProxy)
}

export default initListeners
