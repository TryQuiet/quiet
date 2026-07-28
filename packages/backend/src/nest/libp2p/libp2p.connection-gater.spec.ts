import { Test, TestingModule } from '@nestjs/testing'
import { jest } from '@jest/globals'
import { TestModule } from '../common/test.module'
import { Libp2pModule } from './libp2p.module'
import { Libp2pConnectionGater } from './libp2p.connection-gater'
import { createPeerId } from '../common/utils'
import type { PeerId } from '@libp2p/interface'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr'

describe('Libp2pConnectionGater', () => {
  let module: TestingModule
  let connectionGater: Libp2pConnectionGater
  let peerId: PeerId
  let peerId2: PeerId
  let peerAddress: Multiaddr

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, Libp2pModule],
    }).compile()

    connectionGater = await module.resolve(Libp2pConnectionGater)
    peerId = (await createPeerId()).peerId
    peerId2 = (await createPeerId()).peerId
    peerAddress = multiaddr('/ip4/127.0.0.1/tcp/4001')
  })

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    connectionGater.pauseConnections()
  })

  afterAll(async () => {
    await module.close()
  })

  it('blocks connections by default', () => {
    expect(connectionGater.connectionsAllowed).toBe(false)
  })

  it('pauses and resumes connections properly', () => {
    connectionGater.resumeConnections()
    expect(connectionGater.connectionsAllowed).toBe(true)
    connectionGater.pauseConnections()
    expect(connectionGater.connectionsAllowed).toBe(false)
  })

  describe('checks - paused', () => {
    beforeEach(() => {
      connectionGater.pauseConnections()
    })

    it('denies peer dial when paused', () => {
      expect(connectionGater.gaterImpl.denyDialPeer!(peerId)).toBe(true)
    })

    it('denies multiaddr dial when paused', () => {
      expect(connectionGater.gaterImpl.denyDialMultiaddr!(peerAddress)).toBe(true)
    })

    it('denies outbound connection when paused', () => {
      expect(connectionGater.gaterImpl.denyOutboundConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies outbound encrypted connection when paused', () => {
      expect(connectionGater.gaterImpl.denyOutboundEncryptedConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies outbound relayed connection when paused', () => {
      expect(connectionGater.gaterImpl.denyOutboundRelayedConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies outbound upgraded connection when paused', () => {
      expect(connectionGater.gaterImpl.denyOutboundUpgradedConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies inbound connection when paused', () => {
      expect(connectionGater.gaterImpl.denyInboundConnection!({} as any)).toBe(true)
    })

    it('denies inbound encrypted connection when paused', () => {
      expect(connectionGater.gaterImpl.denyInboundEncryptedConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies inbound relayed connection when paused', () => {
      expect(connectionGater.gaterImpl.denyInboundRelayedConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies inbound upgraded connection when paused', () => {
      expect(connectionGater.gaterImpl.denyInboundUpgradedConnection!(peerId, {} as any)).toBe(true)
    })

    it('denies inbound relay reservation when paused', () => {
      expect(connectionGater.gaterImpl.denyInboundRelayReservation!(peerId)).toBe(true)
    })

    it('returns true for address filtering even when paused', () => {
      expect(connectionGater.gaterImpl.filterMultiaddrForPeer!(peerId, peerAddress)).toBe(true)
    })
  })

  describe('checks - resumed', () => {
    beforeEach(() => {
      connectionGater.resumeConnections()
    })

    it('allows peer dial when resumed', () => {
      expect(connectionGater.gaterImpl.denyDialPeer!(peerId)).toBe(false)
    })

    it('allows multiaddr dial when resumed', () => {
      expect(connectionGater.gaterImpl.denyDialMultiaddr!(peerAddress)).toBe(false)
    })

    it('allows outbound connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyOutboundConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows outbound encrypted connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyOutboundEncryptedConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows outbound relayed connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyOutboundRelayedConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows outbound upgraded connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyOutboundUpgradedConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows inbound connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyInboundConnection!({} as any)).toBe(false)
    })

    it('allows inbound encrypted connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyInboundEncryptedConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows inbound relayed connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyInboundRelayedConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows inbound upgraded connection when resumed', () => {
      expect(connectionGater.gaterImpl.denyInboundUpgradedConnection!(peerId, {} as any)).toBe(false)
    })

    it('allows inbound relay reservation when resumed', () => {
      expect(connectionGater.gaterImpl.denyInboundRelayReservation!(peerId)).toBe(false)
    })

    it('returns true for address filtering when resumed', () => {
      expect(connectionGater.gaterImpl.filterMultiaddrForPeer!(peerId, peerAddress)).toBe(true)
    })
  })
})
