import { Tor } from './torManager'
import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'
import initListeners from './socket/listeners'
import { version } from './../package.json'

export default {
  Tor,
  DataServer,
  ConnectionsManager,
  initListeners,
  version
}
