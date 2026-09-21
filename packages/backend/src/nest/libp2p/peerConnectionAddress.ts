import type { Connection } from '@libp2p/interface'

/** Inbound Tor sockets expose a loopback source port, not the peer's listening address. */
export function peerConnectionAddress(connection: Connection, savedAddress?: string): string {
  const peerAddress = `/p2p/${connection.remotePeer.toString()}`
  const address = savedAddress || (connection.direction === 'outbound' ? connection.remoteAddr?.toString() : '')
  if (!address) return peerAddress
  return address.includes('/p2p/') ? address : `${address}${peerAddress}`
}
