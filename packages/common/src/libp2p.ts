import validator from 'validator'
import { normalizeOverlayHost } from './overlay'
export const PSK_LENGTH = 44

const ONION = '.onion'

export const createLibp2pAddress = (address: string, peerId: string): string => {
  const host = normalizeOverlayHost(address)
  if (host.endsWith(ONION) && host.length !== 56 + ONION.length) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(`Invalid onion address: ${host} length: ${host.length}`)
    }
    console.warn(`Invalid onion address: ${host} length: ${host.length}`)
  }
  return `/dns4/${host}/tcp/80/ws/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  const host = normalizeOverlayHost(address)
  if (host.endsWith(ONION) && host.length !== 56 + ONION.length) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(`Invalid onion address: ${host} length: ${host.length}`)
    }
    console.warn(`Invalid onion address: ${host} length: ${host.length}`)
  }
  return `/dns4/${host}/tcp/80/ws`
}

export const isPSKcodeValid = (psk: string): boolean => {
  const _psk = psk.trim()
  return validator.isBase64(_psk) && _psk.length === PSK_LENGTH
}

export const filterValidAddresses = (addresses: string[]) => {
  return addresses.filter(add =>
    add.match(/^\/dns4\/[a-z0-9.-]+\.(onion|loki)\/tcp\/(443|80)\/ws\/p2p\/[a-zA-Z0-9]{52}$/g)
  )
}
