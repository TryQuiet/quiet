import validator from 'validator'
import { PSK_LENGTH } from './static'

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
