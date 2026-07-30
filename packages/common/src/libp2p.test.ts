import {
  createLibp2pAddress,
  createLibp2pListenAddress,
  createLocalAddress,
  filterValidAddresses,
  getAddressFromLibp2pAddress,
  parseLocalAddress,
} from './libp2p'
import { p2pAddressesToPairs, pairsToP2pAddresses } from './invitationLink/invitationLink'
import { validatePeerData } from './invitationLink/invitationLink.validator'
import { filterAndSortPeers } from './sortPeers'

describe('local libp2p addresses', () => {
  const peerId = '12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF'

  it('converts a local endpoint to listen and dial multiaddrs', () => {
    const address = createLocalAddress(45_321)

    expect(parseLocalAddress(address)).toEqual({ host: '127.0.0.1', port: 45_321 })
    expect(createLibp2pListenAddress(address)).toBe('/ip4/127.0.0.1/tcp/45321/ws')
    expect(createLibp2pAddress(address, peerId)).toBe(`/ip4/127.0.0.1/tcp/45321/ws/p2p/${peerId}`)
  })

  it('round trips a local dial multiaddr to the invitation address', () => {
    const multiaddr = createLibp2pAddress('127.0.0.1:45321', peerId)

    expect(getAddressFromLibp2pAddress(multiaddr)).toBe('127.0.0.1:45321')
    expect(p2pAddressesToPairs([multiaddr])).toEqual([{ peerId, onionAddress: '127.0.0.1:45321' }])
    expect(pairsToP2pAddresses([{ peerId, onionAddress: '127.0.0.1:45321' }])).toEqual([multiaddr])
    expect(validatePeerData({ peerId, onionAddress: '127.0.0.1:45321' })).toBe(true)
  })

  it('rejects invalid local ports', () => {
    expect(parseLocalAddress('127.0.0.1:65536')).toBeUndefined()
    expect(() => createLocalAddress(0)).toThrow('Invalid local transport port')
  })
})

describe('filterValidAddresses', () => {
  it('filters out invalid addresses', () => {
    const localAddress =
      '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY'
    const valid = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      '/ip4/127.0.0.1/tcp/45321/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
    ]
    const addresses = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/wss/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      ...valid,
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbK',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrj.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      '/ip4/127.0.0.1/tcp/65536/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      '/ip4/0.0.0.0/tcp/45321/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      'QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbK',
    ]
    expect(filterAndSortPeers(addresses, [], localAddress)).toEqual([localAddress, ...valid])
  })

  it('sets local address as first without duplicating it', () => {
    const localAddress =
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF'
    const addresses = [
      localAddress,
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
    ]
    expect(filterAndSortPeers(addresses, [], localAddress)).toEqual([localAddress, addresses[1]])
  })
})
