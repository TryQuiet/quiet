export const createLibp2pAddress = (address: string, peerId: string) => {
  return `/dns4/${address}/tcp/443/wss/p2p/${peerId}`
}

export const createLibp2pListenAddress = (address: string) => {
  return `/dns4/${address}/tcp/443/wss`
}
