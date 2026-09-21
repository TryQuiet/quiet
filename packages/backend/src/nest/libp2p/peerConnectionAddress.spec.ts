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
  const redial = jest
    .spyOn(service as unknown as { redialPeerAfterDelay: () => Promise<void> }, 'redialPeerAfterDelay')
    .mockResolvedValue(undefined)
  const connection = {
    ...inbound,
    id: 'inbound-connection',
    status: 'open',
    close: jest.fn(async () => undefined),
  } as unknown as Connection & { close: jest.Mock }
  service.connectedPeers.set('remote-peer', {
    peerId: 'remote-peer',
    address: peerConnectionAddress(inbound),
    connectedAtSeconds: 1,
  })
  service.emit(Libp2pEvents.AUTH_DISCONNECTED, {
    event: { type: 'LOCAL_ERROR', payload: { type: 'TIMEOUT' } },
    connection,
  })
  await jest.runOnlyPendingTimersAsync()
  // The failing transport is closed, and a bare /p2p/ address carries nothing to dial.
  expect(connection.close).toHaveBeenCalled()
  expect(redial).not.toHaveBeenCalled()
  await service.onModuleDestroy()
  jest.useRealTimers()
})
