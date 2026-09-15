export type OverlayKind = 'tor' | 'lokinet'

const ONION_HOST = /^[a-z0-9]{56}(\.onion)?$/i
const LOKI_PUBKEY = /^[a-z0-9]{52}$/i

export function overlayFromHost(host: string): OverlayKind {
  const h = (host || '').toLowerCase().trim()
  if (h.endsWith('.loki') || h.includes('.loki.') || LOKI_PUBKEY.test(h)) return 'lokinet'
  return 'tor'
}

/** Invite URLs, multiaddrs, or raw hosts. */
export function overlayFromUrl(value: string): OverlayKind {
  if (!value) return 'tor'
  if (/\.loki(\/|:|\?|#|$)/i.test(value) || /\/dns4\/[^/]+\.loki\//i.test(value)) return 'lokinet'
  return 'tor'
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
  const onion = a.endsWith('.onion') ? a.slice(0, -6) : a
  return ONION_HOST.test(onion) || ONION_HOST.test(a)
}
