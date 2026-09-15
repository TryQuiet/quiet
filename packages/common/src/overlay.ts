export type OverlayKind = 'tor' | 'lokinet'

const ONION_HOST = /^[a-z0-9]{56}(\.onion)?$/i
/** Lokinet SNApp pubkeys are 52 chars (zbase32). Named .loki hosts are also valid. */
const LOKI_PUBKEY = /^[a-z0-9]{52}$/i

export function overlayFromHost(host: string): OverlayKind {
  const h = (host || '').toLowerCase().trim()
  if (h.endsWith('.onion') || (ONION_HOST.test(h) && !h.includes('.'))) return 'tor'
  if (h.endsWith('.loki') || h.includes('.loki.') || LOKI_PUBKEY.test(h)) return 'lokinet'
  // Quiet Loki is Loki-only: unknown hosts are treated as Lokinet names.
  return 'lokinet'
}

/** Invite URLs, multiaddrs, or raw hosts. */
export function overlayFromUrl(value: string): OverlayKind {
  if (!value) return 'lokinet'
  if (/\.onion(\/|:|\?|#|$)/i.test(value) || /\/dns4\/[^/]+\.onion\//i.test(value)) return 'tor'
  if (/\.loki(\/|:|\?|#|$)/i.test(value) || /\/dns4\/[^/]+\.loki\//i.test(value)) return 'lokinet'
  return 'lokinet'
}

export function normalizeOverlayHost(address: string): string {
  const a = address.trim()
  if (a.endsWith('.loki') || a.endsWith('.onion')) return a.toLowerCase()
  if (ONION_HOST.test(a) && !a.includes('.')) return `${a.toLowerCase()}.onion`
  if (LOKI_PUBKEY.test(a)) return `${a.toLowerCase()}.loki`
  return a
}

export function isValidOverlayHost(address: string): boolean {
  const a = address.trim().toLowerCase()
  if (a.endsWith('.loki')) {
    const name = a.slice(0, -5)
    return name.length >= 1 && /^[a-z0-9.-]+$/.test(name)
  }
  if (LOKI_PUBKEY.test(a)) return true
  const onion = a.endsWith('.onion') ? a.slice(0, -6) : a
  return ONION_HOST.test(onion) || ONION_HOST.test(a)
}

export function isValidSnappAddress(address: string): boolean {
  const a = address.trim().toLowerCase()
  if (!a || a.length === 0) return false
  if (a.endsWith('.onion')) return false
  const bare = a.endsWith('.loki') ? a.slice(0, -5) : a
  // Prefer 52-char SNApp pubkeys; also allow named .loki hosts (non-empty labels).
  if (LOKI_PUBKEY.test(bare)) return true
  if (a.endsWith('.loki') && bare.length >= 1 && /^[a-z0-9.-]+$/.test(bare) && bare.length !== 56) return true
  return false
}

export const LOKINET_DNS = process.env.LOKINET_DNS || '127.3.2.1'
export const LOKINET_LISTEN_HOST = process.env.LOKINET_LISTEN_HOST || '172.16.0.1'
export const LOKINET_WS_PORT = Number(process.env.LOKINET_WS_PORT || 80)
