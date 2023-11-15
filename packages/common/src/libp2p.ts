import validator from 'validator'
export const PSK_LENGTH = 44 // PSK is 256 bits/8 = 32 bytes which encodes to 44 characters base64

const ONION = '.onion'

export const createLibp2pAddress = (address: string, peerId: string) => {
  if (!address.endsWith(ONION)) address += ONION
  return `/dns4/${address}/tcp/80/ws/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  if (!address.endsWith(ONION)) address += ONION
  return `/dns4/${address}/tcp/80/ws`
}

export const isPSKcodeValid = (psk: string): boolean => {
  const _psk = psk.trim()
  return validator.isBase64(_psk) && _psk.length === PSK_LENGTH
}
