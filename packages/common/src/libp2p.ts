const ONION = '.onion'

export const createLibp2pAddress = (address: string, peerId: string) => {
  if (!address.endsWith(ONION)) address += ONION
  return `/dns4/${address}/tcp/80/ws/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  if (!address.endsWith(ONION)) address += ONION
  return `/dns4/${address}/tcp/80/ws`
}
