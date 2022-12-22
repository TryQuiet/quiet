import type { Multiaddr } from '@multiformats/multiaddr'

export function all (multiaddrs: Multiaddr[]) {
  return multiaddrs.filter((ma) => {
      return true
    })
}
