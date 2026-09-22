import { createLibp2p as createNativeLibp2p } from 'libp2p'
import mode from './mode.cjs'

export * from 'libp2p'

export async function createLibp2p(options = {}) {
  mode.requireQssOnlyEnvironment()
  // Keep the real libp2p node and its datastore/services so Helia, OrbitDB,
  // identities and persistence use the production implementation. There is no
  // network transport, listening address, discovery source or dial fallback.
  return createNativeLibp2p({
    ...options,
    addresses: { listen: [], announce: [] },
    transports: [],
    peerDiscovery: [],
    connectionGater: {
      denyDialPeer: async () => true,
      denyDialMultiaddr: async () => true,
      denyInboundConnection: async () => true,
      denyOutboundConnection: async () => true,
    },
  })
}
