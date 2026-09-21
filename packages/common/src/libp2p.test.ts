import {
  createLibp2pAddress,
  createLibp2pListenAddress,
  createLocalAddress,
  filterValidAddresses,
  getAddressFromLibp2pAddress,
  isLocalTransportEnabled,
  parseLocalAddress,
} from './libp2p'
import { p2pAddressesToPairs, pairsToP2pAddresses } from './invitationLink/invitationLink'
import { validatePeerData } from './invitationLink/invitationLink.validator'
import { filterAndSortPeers } from './sortPeers'

const PEER_ID = '12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF'
const LOCAL_MULTIADDR = `/ip4/127.0.0.1/tcp/45321/ws/p2p/${PEER_ID}`

describe('local transport gating', () => {
  const previousIsE2e = process.env.IS_E2E
  const previousLocalTransport = process.env.LOCAL_TRANSPORT

  afterEach(() => {
    if (previousIsE2e == null) delete process.env.IS_E2E
    else process.env.IS_E2E = previousIsE2e
    if (previousLocalTransport == null) delete process.env.LOCAL_TRANSPORT
    else process.env.LOCAL_TRANSPORT = previousLocalTransport
  })

  describe('when enabled', () => {
    beforeEach(() => {
      process.env.IS_E2E = 'true'
      process.env.LOCAL_TRANSPORT = 'true'
    })

    it('converts a local endpoint to listen and dial multiaddrs', () => {
      const address = createLocalAddress(45_321)

      expect(isLocalTransportEnabled()).toBe(true)
      expect(parseLocalAddress(address)).toEqual({ host: '127.0.0.1', port: 45_321 })
      expect(createLibp2pListenAddress(address)).toBe('/ip4/127.0.0.1/tcp/45321/ws')
      expect(createLibp2pAddress(address, PEER_ID)).toBe(LOCAL_MULTIADDR)
    })

    it('round trips a local dial multiaddr to the invitation address', () => {
      const multiaddr = createLibp2pAddress('127.0.0.1:45321', PEER_ID)

      expect(getAddressFromLibp2pAddress(multiaddr)).toBe('127.0.0.1:45321')
      expect(p2pAddressesToPairs([multiaddr])).toEqual([{ peerId: PEER_ID, onionAddress: '127.0.0.1:45321' }])
      expect(pairsToP2pAddresses([{ peerId: PEER_ID, onionAddress: '127.0.0.1:45321' }])).toEqual([multiaddr])
      expect(validatePeerData({ peerId: PEER_ID, onionAddress: '127.0.0.1:45321' })).toBe(true)
      expect(filterValidAddresses([LOCAL_MULTIADDR])).toEqual([LOCAL_MULTIADDR])
    })

    it('rejects invalid local ports', () => {
      expect(parseLocalAddress('127.0.0.1:65536')).toBeUndefined()
      expect(() => createLocalAddress(0)).toThrow('Invalid local transport port')
    })
  })

  it.each([
    ['both flags unset', undefined, undefined],
    ['only LOCAL_TRANSPORT set', undefined, 'true'],
    ['only IS_E2E set', 'true', undefined],
  ])('stays closed with %s', (_label, isE2e, localTransport) => {
    if (isE2e == null) delete process.env.IS_E2E
    else process.env.IS_E2E = isE2e
    if (localTransport == null) delete process.env.LOCAL_TRANSPORT
    else process.env.LOCAL_TRANSPORT = localTransport

    expect(isLocalTransportEnabled()).toBe(false)
    expect(parseLocalAddress('127.0.0.1:45321')).toBeUndefined()
    expect(getAddressFromLibp2pAddress(LOCAL_MULTIADDR)).toBeUndefined()
    expect(validatePeerData({ peerId: PEER_ID, onionAddress: '127.0.0.1:45321' })).toBe(false)
    expect(filterValidAddresses([LOCAL_MULTIADDR])).toEqual([])
    expect(p2pAddressesToPairs([LOCAL_MULTIADDR])).toEqual([])
  })
})

describe('filterValidAddresses', () => {
  it('filters out invalid addresses', () => {
    const localAddress =
      '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY'
    const valid = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
    ]
    const addresses = [
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/wss/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
      ...valid,
      'invalidAddress',
      '/dns4/somethingElse.onion/tcp/443/wss/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSA',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrjad.onion/tcp/443/ws/p2p/QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbK',
      '/dns4/gloao6h5plwjy4tdlze24zzgcxll6upq2ex2fmu2ohhyu4gtys4nrj.onion/tcp/443/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN4zF',
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

  it('prioritizes connected peers when more than three candidates are available', () => {
    const addresses = [
      '/dns4/f3lupwnhaqplbn4djaut5rtipwmlotlb57flfvjzgexek2yezlpjddid.onion/tcp/80/ws/p2p/12D3KooWEHzmff5kZAvyU6Diq5uJG8QkWJxFNUcBLuWjxUGvxaqw',
      '/dns4/ubapl2lfxci5cc35oegshdsjhlt656xo6vbmztpb2ndb6ftqjjuv5myd.onion/tcp/80/ws/p2p/12D3KooWKCWstmqi5gaQvipT7xVneVGfWV7HYpCbmUu626R92hXx',
      '/dns4/rjdhzqgrl3bzu4v5cwfla3tafjtdeuzeapk34qvf7mvfhc3hih5fmnqd.onion/tcp/80/ws/p2p/12D3KooWHgLdRMqkepNiYnrur21cyASUNk1f9NZ5tuGa9He8QXNa',
      '/dns4/hricycxramxkn4v46b3pllnozfop6fkl7xdfk2htboe3zakhq3ephjid.onion/tcp/80/ws/p2p/12D3KooWSYQf8zzr5rYnUdLxYyLzHruQHPaMssja1ADifGAcN3qY',
      '/dns4/kkzkv2u53aehfjz7mqgnt3mp2hemcr2h74vtmxpxuh4a5yna7kltsiqd.onion/tcp/80/ws/p2p/12D3KooWPYjyHnYYwe3kzEESMVbpAUHkQyEQpRHehH8QYtGRntVn',
    ]
    const stats = addresses.map((address, index) => ({
      peerId: address.split('/')[7],
      address,
      lastSeen: 100 - index,
      connectionTime: 100 - index,
    }))
    const connected = [stats[4].peerId, stats[3].peerId]

    expect(filterAndSortPeers(addresses, stats, undefined, false, connected).slice(0, 2)).toEqual([
      addresses[3],
      addresses[4],
    ])
  })
})
