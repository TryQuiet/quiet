import { connections } from './connection'

const initListeners = (io, connectionManager) => {
  connections(io, connectionManager)
}

export default initListeners
