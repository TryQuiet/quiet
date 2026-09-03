import validator from 'validator'
export const PSK_LENGTH = 44 // PSK is 256 bits/8 = 32 bytes which encodes to 44 characters base64

const ONION = '.onion'
const LOCAL_HOST = '127.0.0.1'
const LOCAL_ADDRESS_REGEX = /^127\.0\.0\.1:([1-9][0-9]{0,4})$/
const PEER_ID_PATTERN = '[a-zA-Z0-9]{52}'
const ONION_MULTIADDR_REGEX = new RegExp(`^/dns4/[a-z0-9]{56}\\.onion/tcp/(443|80)/ws/p2p/${PEER_ID_PATTERN}$`)
const LOCAL_MULTIADDR_REGEX = new RegExp(
  `^/ip4/${LOCAL_HOST.replace(/\./g, '\\.')}/tcp/([1-9][0-9]{0,4})/ws/p2p/${PEER_ID_PATTERN}$`
)

export type LocalAddress = {
  host: typeof LOCAL_HOST
  port: number
}

export const parseLocalAddress = (address: string): LocalAddress | undefined => {
  const match = address.match(LOCAL_ADDRESS_REGEX)
  if (match == null) return undefined

  const port = Number(match[1])
  if (!Number.isSafeInteger(port) || port > 65_535) return undefined

  return { host: LOCAL_HOST, port }
}

export const createLocalAddress = (port: number): string => {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid local transport port: ${port}`)
  }
  return `${LOCAL_HOST}:${port}`
}

export const getAddressFromLibp2pAddress = (peerAddress: string): string | undefined => {
  const segments = peerAddress.split('/')
  const dnsIndex = segments.indexOf('dns4')
  if (dnsIndex !== -1) {
    const address = segments[dnsIndex + 1]
    if (address == null) return undefined
    return address.endsWith(ONION) ? address.slice(0, -ONION.length) : address
  }

  const ipIndex = segments.indexOf('ip4')
  const tcpIndex = segments.indexOf('tcp')
  if (ipIndex === -1 || tcpIndex === -1 || segments[ipIndex + 1] !== LOCAL_HOST) return undefined

  const port = Number(segments[tcpIndex + 1])
  return Number.isSafeInteger(port) ? createLocalAddress(port) : undefined
}

/**
 * Creates a libp2p multiaddr from an onion or local transport address and a peerId
 * @param address - The onion address or a 127.0.0.1:<port> local address
 * @param peerId - The peerId
 * @returns The libp2p multiaddr
 * @throws Error if the address is invalid
 */
export const createLibp2pAddress = (address: string, peerId: string): string => {
  const localAddress = parseLocalAddress(address)
  if (localAddress != null) {
    return `/ip4/${localAddress.host}/tcp/${localAddress.port}/ws/p2p/${peerId}`
  }

  if (!address.endsWith(ONION)) address += ONION
  if (address.length !== 56 + ONION.length) {
    if (process.env.NODE_ENV !== 'test')
      throw new Error(`Invalid address: ${address} length: ${address.length} expected: ${56 + ONION.length}`)
    console.warn(`Invalid address: ${address} length: ${address.length} expected: ${56 + ONION.length}`)
  }
  return `/dns4/${address}/tcp/80/ws/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  const localAddress = parseLocalAddress(address)
  if (localAddress != null) {
    return `/ip4/${localAddress.host}/tcp/${localAddress.port}/ws`
  }

  if (!address.endsWith(ONION)) address += ONION
  if (address.length !== 56 + ONION.length) {
    if (process.env.NODE_ENV !== 'test')
      throw new Error(`Invalid address: ${address} length: ${address.length} expected: ${56 + ONION.length}`)
    console.warn(`Invalid address: ${address} length: ${address.length} expected: ${56 + ONION.length}`)
  }
  return `/dns4/${address}/tcp/80/ws`
}

export const isPSKcodeValid = (psk: string): boolean => {
  const _psk = psk.trim()
  return validator.isBase64(_psk) && _psk.length === PSK_LENGTH
}

export const filterValidAddresses = (addresses: string[]) => {
  return addresses.filter(address => {
    if (ONION_MULTIADDR_REGEX.test(address)) return true

    const localMatch = address.match(LOCAL_MULTIADDR_REGEX)
    return localMatch != null && Number(localMatch[1]) <= 65_535
  })
}
