import { jest } from '@jest/globals'
import { Test, TestingModule } from '@nestjs/testing'
import getPort from 'get-port'
import { once } from 'events'

import { ConnectionsManagerModule } from '../nest/connections-manager/connections-manager.module'
import { Libp2pModule } from '../nest/libp2p/libp2p.module'
import { Libp2pService } from '../nest/libp2p/libp2p.service'
import { Libp2pEvents, Libp2pNodeParams } from '../nest/libp2p/libp2p.types'
import { IpfsModule } from '../nest/ipfs/ipfs.module'
import { StorageModule } from '../nest/storage/storage.module'
import { SigChainService } from '../nest/auth/sigchain.service'
import { TestModule } from '../nest/common/test.module'
import { createPeerId, generateLibp2pPSK } from '../nest/common/utils'
import { SOCKS_PROXY_AGENT } from '../nest/const'
import { TorModule } from '../nest/tor/tor.module'
import { Tor } from '../nest/tor/tor.service'

const holdMs = Number(process.env.P2P_DEBUG_HOLD_MS ?? '150000')
const sampleMs = Number(process.env.P2P_DEBUG_SAMPLE_MS ?? '5000')
const listenOnLocalhost = process.env.P2P_DEBUG_LISTEN_ON_LOCALHOST === 'true'
const abortOnPingFailure = process.env.LIBP2P_ABORT_CONNECTION_ON_PING_FAILURE ?? 'true'
const dialRetries = Number(process.env.P2P_DEBUG_DIAL_RETRIES ?? '4')
const dialRetryBaseDelayMs = Number(process.env.P2P_DEBUG_DIAL_RETRY_BASE_DELAY_MS ?? '5000')

jest.setTimeout(420_000)

interface PeerHarness {
  index: number
  module: TestingModule
  sigchain: SigChainService
  libp2p: Libp2pService
  targetPort: number
  onionAddress: string
}

interface DisconnectRecord {
  peer: string
  event: string
  atMs: number
  payload: unknown
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

const waitUntil = async (predicate: () => boolean, timeoutMs: number, label: string) => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`${label} timed out after ${timeoutMs}ms`)
}

const isRetryableDialError = (error: any): boolean => {
  const message = String(error?.message ?? '').toLowerCase()
  return (
    error?.retryable === true ||
    error?.code === 'ERR_RETRYABLE_WEBSOCKET_UPGRADE' ||
    error?.code === 'ERR_UNEXPECTED_EOF' ||
    error?.code === 'ABORT_ERR' ||
    ['RetryableWebSocketUpgradeError', 'UnexpectedEOFError', 'AbortError', 'TimeoutError'].includes(error?.name) ||
    message.includes('unexpected end of input') ||
    message.includes('read aborted')
  )
}

const dialWithRetries = async (dialer: Libp2pService, peerAddress: string) => {
  for (let attempt = 0; attempt <= dialRetries; attempt += 1) {
    try {
      await dialer.dialPeer(peerAddress, { throwOnError: true, redialOnError: false })
      return
    } catch (error: any) {
      if (attempt >= dialRetries || !isRetryableDialError(error)) {
        throw error
      }
      const delayMs = dialRetryBaseDelayMs * (attempt + 1)
      console.log(
        `P2P_DEBUG_DIAL_RETRY ${JSON.stringify({
          attempt: attempt + 1,
          nextDelayMs: delayMs,
          errorName: error?.name,
          errorCode: error?.code,
          errorMessage: error?.message,
        })}`
      )
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

const connectionSnapshot = (peer: PeerHarness) => {
  const connections = peer.libp2p.libp2pInstance?.getConnections() ?? []
  return {
    peer: peer.index,
    connectedPeers: peer.libp2p.connectedPeers.size,
    libp2pConnections: connections.length,
    connectionStatuses: connections.map(conn => ({
      id: conn.id,
      direction: conn.direction,
      status: conn.status,
      remotePeer: conn.remotePeer.toString(),
      remoteAddr: conn.remoteAddr.toString(),
    })),
  }
}

const makePeerModule = async (index: number): Promise<PeerHarness> => {
  const module = await Test.createTestingModule({
    imports: [TestModule, Libp2pModule, StorageModule, ConnectionsManagerModule, IpfsModule],
  }).compile()

  return {
    index,
    module,
    sigchain: await module.resolve(SigChainService),
    libp2p: await module.resolve(Libp2pService),
    targetPort: await getPort(),
    onionAddress: '',
  }
}

const closePeer = async (peer: PeerHarness) => {
  await peer.libp2p.close().catch(err => {
    console.error(`peer ${peer.index} libp2p close failed`, err)
  })
  await peer.module.close().catch(err => {
    console.error(`peer ${peer.index} module close failed`, err)
  })
}

describe('debug p2p disconnects over tor', () => {
  it('holds a Tor WebSocket libp2p auth connection through heartbeat checks', async () => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
    process.env.NETWORK_LOGGING = process.env.NETWORK_LOGGING ?? 'true'
    process.env.LIBP2P_ABORT_CONNECTION_ON_PING_FAILURE = abortOnPingFailure

    const torModule = await Test.createTestingModule({
      imports: [TestModule, TorModule],
    }).compile()
    const tor = await torModule.resolve(Tor)
    const agent = await torModule.resolve(SOCKS_PROXY_AGENT)
    const disconnects: DisconnectRecord[] = []
    const samples: Array<Record<string, unknown>> = []
    const peers: PeerHarness[] = []

    try {
      await tor.init()
      await waitUntil(() => tor.bootstrapped, 120_000, 'tor bootstrap')

      peers.push(await makePeerModule(0))
      peers.push(await makePeerModule(1))

      await peers[0].sigchain.createChain('p2p-debug-team', 'peer0', true)
      const invite = peers[0].sigchain.getActiveChain().invites.createLongLivedUserInvite()
      await peers[1].sigchain.createChainFromInvite(
        'peer1',
        'p2p-debug-team',
        invite.seed,
        peers[0].sigchain.team.id,
        true
      )

      const psk = generateLibp2pPSK().fullKey
      for (const peer of peers) {
        const hiddenService = await tor.createNewHiddenService({ targetPort: peer.targetPort })
        peer.onionAddress = hiddenService.onionAddress
        const peerId = await createPeerId()
        const listenAddress = listenOnLocalhost
          ? `/ip4/127.0.0.1/tcp/${peer.targetPort}/ws`
          : peer.libp2p.createLibp2pListenAddress(peer.onionAddress)
        const params: Libp2pNodeParams = {
          peerId,
          listenAddresses: [listenAddress],
          agent,
          localAddress: peer.libp2p.createLibp2pAddress(peer.onionAddress, peerId.peerId.toString()),
          targetPort: peer.targetPort,
          psk,
          torBootstrap: tor,
          instanceName: `p2p-debug-${peer.index}`,
        }

        peer.libp2p.on(Libp2pEvents.PEER_DISCONNECTED, payload => {
          disconnects.push({
            peer: `peer${peer.index}`,
            event: Libp2pEvents.PEER_DISCONNECTED,
            atMs: Date.now(),
            payload,
          })
        })
        await peer.libp2p.createInstance(params)
      }

      const joinedPromise = once(peers[1].libp2p, Libp2pEvents.AUTH_JOINED)
      await dialWithRetries(peers[1].libp2p, peers[0].libp2p.localAddress)
      await withTimeout(joinedPromise, 120_000, 'AUTH_JOINED')
      await waitUntil(
        () =>
          peers.every(peer => {
            const openConnections = peer.libp2p.libp2pInstance?.getConnections().filter(conn => conn.status === 'open')
            return (openConnections?.length ?? 0) > 0
          }),
        60_000,
        'open connections on both peers'
      )

      const holdStartedAt = Date.now()
      while (Date.now() - holdStartedAt < holdMs) {
        samples.push({
          atMs: Date.now(),
          ageMs: Date.now() - holdStartedAt,
          peers: peers.map(connectionSnapshot),
          disconnects: disconnects.length,
        })
        if (disconnects.length > 0) break
        await new Promise(resolve => setTimeout(resolve, sampleMs))
      }

      const result = {
        ok: disconnects.length === 0,
        abortOnPingFailure,
        dialRetries,
        holdMs,
        sampleMs,
        listenOnLocalhost,
        disconnects,
        finalSnapshot: peers.map(connectionSnapshot),
        sampleCount: samples.length,
        firstSample: samples[0],
        lastSample: samples[samples.length - 1],
      }

      console.log(`P2P_DEBUG_RESULT ${JSON.stringify(result)}`)
      expect(result.ok).toBe(true)
    } finally {
      for (const peer of peers.reverse()) {
        await closePeer(peer)
      }
      await tor.kill().catch(err => {
        console.error('tor kill failed', err)
      })
      await torModule.close().catch(err => {
        console.error('tor module close failed', err)
      })
    }
  })
})
