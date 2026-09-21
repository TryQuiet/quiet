import { preSharedKey } from '@libp2p/pnet'

export const CONNECTION_UPGRADE_TIMEOUT_MS = 60_000

// Tor nonce delivery can exceed pnet's one-second default. Protection is part
// of the existing connection upgrade, so use the same bounded budget.
export const createConnectionProtector = (psk: Uint8Array) =>
  preSharedKey({ psk, timeout: CONNECTION_UPGRADE_TIMEOUT_MS })
