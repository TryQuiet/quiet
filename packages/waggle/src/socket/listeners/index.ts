import { connections } from './connection'

const initListeners = (io, connectionManager, git) => {
  connections(io, connectionManager, git)
}

export default initListeners
