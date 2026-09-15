import validator from 'validator'
import { isValidSnappAddress, normalizeOverlayHost, LOKINET_WS_PORT } from './overlay'
export const PSK_LENGTH = 44

const LOKI = '.loki'

export const createLibp2pAddress = (address: string, peerId: string): string => {
  const host = normalizeOverlayHost(address)
  if (!isValidSnappAddress(host.replace(/\.loki$/i, '')) && !isValidSnappAddress(host)) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(`Invalid Loki SNApp address: ${host}`)
    }
    console.warn(`Invalid Loki SNApp address: ${host}`)
  }
  const dnsHost = host.endsWith(LOKI) ? host : `${host}${LOKI}`
  return `/dns4/${dnsHost}/tcp/${LOKINET_WS_PORT}/ws/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  const host = normalizeOverlayHost(address)
  if (!isValidSnappAddress(host.replace(/\.loki$/i, '')) && !isValidSnappAddress(host)) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(`Invalid Loki SNApp address: ${host}`)
    }
    console.warn(`Invalid Loki SNApp address: ${host}`)
  }
  const dnsHost = host.endsWith(LOKI) ? host : `${host}${LOKI}`
  return `/dns4/${dnsHost}/tcp/${LOKINET_WS_PORT}/ws`
}

export const isPSKcodeValid = (psk: string): boolean => {
  const _psk = psk.trim()
  return validator.isBase64(_psk) && _psk.length === PSK_LENGTH
}

export const filterValidAddresses = (addresses: string[]) => {
  return addresses.filter(add =>
    add.match(new RegExp(`^/dns4/[a-z0-9]{52}\\.loki/tcp/(${LOKINET_WS_PORT}|80|443)/ws/p2p/[a-zA-Z0-9]{46,52}$`))
  )
}
