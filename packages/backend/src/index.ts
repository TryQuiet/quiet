import { Tor } from './torManager'
import { DataServer } from './socket/DataServer'
import { ConnectionsManager } from './libp2p/connectionsManager'

export { DataServer } from './socket/DataServer'
export { ConnectionsManager } from './libp2p/connectionsManager'

// eslint-disable-next-line
const version = process.env.npm_package_version

export default {
  Tor,
  DataServer,
  ConnectionsManager,
  version
}

export * from './common/utils'
