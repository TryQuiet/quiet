import { jest } from '@jest/globals'
import type { Connection } from '@libp2p/interface'
import { peerConnectionAddress } from './peerConnectionAddress'
import { Libp2pService } from './libp2p.service'
import { Libp2pEvents } from './libp2p.types'

const inbound = {
  direction: 'inbound',
  remotePeer: { toString: () => 'remote-peer' },
  remoteAddr: { toString: () => '/ip4/127.0.0.1/tcp/49123/ws' },
} as Connection

it('keeps an unknown inbound Tor peer address usable for hangup without storing its ephemeral port', () => {
  expect(peerConnectionAddress(inbound)).toBe('/p2p/remote-peer')
  expect(peerConnectionAddress(inbound, '/dns4/peer.onion/tcp/80/ws')).toBe(
    '/dns4/peer.onion/tcp/80/ws/p2p/remote-peer'
  )
  expect(peerConnectionAddress({ ...inbound, direction: 'outbound' })).toBe(
    '/ip4/127.0.0.1/tcp/49123/ws/p2p/remote-peer'
  )
})

it('hangs up an unknown inbound peer after an auth timeout without scheduling an ephemeral redial', async () => {
  jest.useFakeTimers()
  const service = new Libp2pService({} as any, '', {} as any, {} as any, {} as any)
  const hangUp = jest.spyOn(service, 'hangUpPeer').mockResolvedValue(undefined)
  service.connectedPeers.set('remote-peer', {
    peerId: 'remote-peer',
    address: peerConnectionAddress(inbound),
    connectedAtSeconds: 1,
  })
  service.emit(Libp2pEvents.AUTH_DISCONNECTED, {
    event: { type: 'LOCAL_ERROR', payload: { type: 'TIMEOUT' } },
    connection: { remotePeer: inbound.remotePeer },
  })
  await jest.runOnlyPendingTimersAsync()
  expect(hangUp).toHaveBeenCalledWith('/p2p/remote-peer', false)
  await service.onModuleDestroy()
  jest.useRealTimers()
})
