import { jest } from '@jest/globals'
import { gossipsub, type GossipSub } from '@chainsafe/libp2p-gossipsub'
import { noise, pureJsCrypto } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { memory } from '@libp2p/memory'
import { type Connection, type Libp2p, type PeerId, type Stream } from '@libp2p/interface'
import { type Registrar } from '@libp2p/interface-internal'
import { createLibp2p } from 'libp2p'
import { fromString, toString } from 'uint8arrays'
import waitForExpect from 'wait-for-expect'
import { randomUUID } from 'node:crypto'

type Node = Libp2p<{ pubsub: GossipSub }>
type StreamWrapper = { rawStream: Stream }
type InboundWrapper = StreamWrapper & { source: AsyncIterable<unknown> }

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>(done => {
    resolve = done
  })
  return { promise, resolve }
}

describe('Pinned gossipsub stream lifecycle', () => {
  let nodes: Node[] = []
  const releases: Array<() => void> = []
  const messages: string[][] = []
  const topic = 'quiet-transport-recovery'

  const outgoing = (index: number, remote: number) =>
    nodes[index].services.pubsub.streamsOutbound.get(nodes[remote].peerId.toString()) as unknown as
      StreamWrapper | undefined

  const incoming = (index: number, remote: number) =>
    nodes[index].services.pubsub.streamsInbound.get(nodes[remote].peerId.toString()) as unknown as
      StreamWrapper | undefined

  const expectLiveStreams = async (left: number, right: number) => {
    await waitForExpect(() => {
      for (const [index, remote] of [
        [left, right],
        [right, left],
      ]) {
        for (const [direction, stream] of [
          ['outbound', outgoing(index, remote)],
          ['inbound', incoming(index, remote)],
        ] as const) {
          expect({ peer: index, direction, status: stream?.rawStream.status }).toEqual({
            peer: index,
            direction,
            status: 'open',
          })
          expect(
            nodes[index]
              .getConnections(nodes[remote].peerId)
              .some(connection => connection.streams.includes(stream!.rawStream))
          ).toBe(true)
        }
        expect(nodes[index].services.pubsub.getSubscribers(topic).map(peer => peer.toString())).toContain(
          nodes[remote].peerId.toString()
        )
      }
    }, 5_000)
  }

  const expectDelivery = async (from: number, to: number, message: string) => {
    await nodes[from].services.pubsub.publish(topic, fromString(message))
    await waitForExpect(() => expect(messages[to]).toContain(message), 5_000)
  }

  beforeEach(async () => {
    for (let index = 0; index < 3; index += 1) {
      const node = await createLibp2p({
        addresses: { listen: [`/memory/${randomUUID()}`] },
        // These pinned transports carry older interface declarations, as in
        // the application's in-memory libp2p fixture; use their real runtime.
        transports: [memory() as any],
        connectionEncrypters: [noise({ crypto: pureJsCrypto }) as any],
        streamMuxers: [yamux()],
        services: {
          identify: identify(),
          pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, floodPublish: true }),
        },
      })
      nodes.push(node as unknown as Node)
      messages[index] = []
      node.services.pubsub.addEventListener('message', event => messages[index].push(toString(event.detail.data)))
      node.services.pubsub.subscribe(topic)
    }
  })

  afterEach(async () => {
    releases.splice(0).forEach(release => release())
    await Promise.all(nodes.map(node => node.stop()))
    for (const node of nodes) {
      expect(node.services.pubsub.streamsInbound.size).toBe(0)
      expect(node.services.pubsub.streamsOutbound.size).toBe(0)
      expect(
        (node.services.pubsub as unknown as { outboundConnections: Map<string, Connection> }).outboundConnections.size
      ).toBe(0)
    }
    jest.restoreAllMocks()
    nodes = []
    messages.length = 0
  })

  it('replays subscriptions over the surviving transport while preserving another peer', async () => {
    await nodes[0].dial(nodes[1].getMultiaddrs())
    await nodes[0].dial(nodes[2].getMultiaddrs())
    await expectLiveStreams(0, 1)
    await expectLiveStreams(0, 2)
    const unrelated = outgoing(0, 2)
    const original = nodes[0].getConnections(nodes[1].peerId)[0]
    const originalRemote = nodes[1].getConnections(nodes[0].peerId)[0]
    const oldOutbound = outgoing(1, 0)

    await nodes[0].dial(nodes[1].getMultiaddrs(), { force: true })
    await waitForExpect(() => {
      expect(nodes[0].getConnections(nodes[1].peerId)).toHaveLength(2)
      expect(nodes[1].getConnections(nodes[0].peerId)).toHaveLength(2)
    })
    original.abort(new Error('Retiring the older circuit'))
    await waitForExpect(() => expect(originalRemote.status).toBe('closed'))
    await expectLiveStreams(0, 1)
    expect(outgoing(1, 0)).not.toBe(oldOutbound)
    expect(outgoing(0, 2)).toBe(unrelated)
    expect(nodes[0].services.pubsub.getTopics()).toContain(topic)
    await expectDelivery(0, 1, 'owner message after overlap')
    await expectDelivery(1, 0, 'joiner message after overlap')
    await expectDelivery(0, 2, 'unrelated peer stays subscribed')
  })

  it('recovers on transport close while the old outbound sink is still completing', async () => {
    const release = deferred()
    releases.push(release.resolve)
    let held = false
    let heldStream: Stream | undefined
    let sinkCompleted = false
    nodes[0].addEventListener('connection:open', ({ detail: connection }) => {
      const open = connection.newStream.bind(connection)
      jest.spyOn(connection, 'newStream').mockImplementation(async (protocols, options) => {
        const stream = await open(protocols, options)
        if (!held && stream.protocol?.startsWith('/meshsub/')) {
          held = true
          heldStream = stream
          const sink = stream.sink.bind(stream)
          stream.sink = async source => {
            try {
              await sink(source)
            } finally {
              await release.promise
              sinkCompleted = true
            }
          }
        }
        return stream
      })
    })
    await nodes[0].dial(nodes[1].getMultiaddrs())
    await expectLiveStreams(0, 1)
    const original = nodes[0].getConnections(nodes[1].peerId)[0]
    const old = outgoing(0, 1)!
    expect(old.rawStream).toBe(heldStream)
    await nodes[0].dial(nodes[1].getMultiaddrs(), { force: true })
    await waitForExpect(() => expect(nodes[1].getConnections(nodes[0].peerId)).toHaveLength(2))
    original.abort(new Error('Physical circuit ends before its buffered sink settles'))
    await waitForExpect(() => expect(original.status).toBe('closed'))
    expect(['aborted', 'closed', 'reset']).toContain(old.rawStream.status)
    expect(sinkCompleted).toBe(false)
    await expectLiveStreams(0, 1)
    const replacement = outgoing(0, 1)
    expect(replacement).not.toBe(old)
    await expectDelivery(0, 1, 'delivery while old sink cleanup is pending')
    release.resolve()
    await expectDelivery(1, 0, 'delivery after late old sink completion')
    expect(outgoing(0, 1)).toBe(replacement)
  })

  it('ignores the retired inbound reader failing after replacement streams are live', async () => {
    const release = deferred()
    releases.push(release.resolve)
    const pubsub = nodes[1].services.pubsub as unknown as {
      pipePeerReadStream: (peer: PeerId, stream: InboundWrapper, connection: Connection) => Promise<void>
    }
    const read = pubsub.pipePeerReadStream.bind(pubsub)
    const lateError = deferred()
    jest.spyOn(pubsub, 'pipePeerReadStream').mockImplementationOnce(async (peer, stream, connection) => {
      const source = stream.source
      stream.source = (async function* () {
        let failure = new Error('Delayed failure from the retired inbound stream')
        try {
          yield* source
        } catch (error) {
          failure = error as Error
        }
        await release.promise
        lateError.resolve()
        throw failure
      })()
      await read(peer, stream, connection)
    })

    await nodes[0].dial(nodes[1].getMultiaddrs())
    await expectLiveStreams(0, 1)
    const original = nodes[0].getConnections(nodes[1].peerId)[0]
    await nodes[0].dial(nodes[1].getMultiaddrs(), { force: true })
    original.abort(new Error('Retiring the transport while its read loop unwinds'))
    await expectLiveStreams(0, 1)
    const replacement = outgoing(1, 0)
    const replacementInbound = incoming(1, 0)
    release.resolve()
    await lateError.promise
    await expectDelivery(0, 1, 'delivery after stale inbound error')
    await expectDelivery(1, 0, 'reverse delivery after stale inbound error')
    expect(outgoing(1, 0)).toBe(replacement)
    expect(incoming(1, 0)).toBe(replacementInbound)
  })

  it('does not restore a peer when an inbound handler arrives after its transport closed', async () => {
    await nodes[0].dial(nodes[1].getMultiaddrs())
    await expectLiveStreams(0, 1)
    const connection = nodes[0].getConnections(nodes[1].peerId)[0]
    const stream = incoming(0, 1)!.rawStream
    connection.abort(new Error('Transport closes before a queued inbound handler runs'))
    await waitForExpect(() => {
      expect(connection.status).toBe('closed')
      expect(nodes[0].services.pubsub.getPeers()).toHaveLength(0)
    })
    const pubsub = nodes[0].services.pubsub
    const delayed = pubsub as unknown as {
      onIncomingStream: (incoming: { stream: Stream; connection: Connection }) => void
    }
    delayed.onIncomingStream({ stream, connection })
    expect(pubsub.getPeers()).toHaveLength(0)
    expect(pubsub.streamsInbound.size).toBe(0)
    expect(pubsub.streamsOutbound.size).toBe(0)
  })

  it.each(['close', 'abort'] as const)(
    'repairs a raw stream %s while its physical transport stays open',
    async mode => {
      await nodes[0].dial(nodes[1].getMultiaddrs())
      await expectLiveStreams(0, 1)
      const physical = nodes[0].getConnections(nodes[1].peerId)[0]
      const old = outgoing(0, 1)!
      if (mode === 'close') await old.rawStream.close()
      else old.rawStream.abort(new Error('Reset only the pubsub stream'))

      // No new connection, identify notification, protocol registration, or
      // publication is needed to remove the obsolete wrapper and replay topics.
      await waitForExpect(() => expect(outgoing(0, 1)).not.toBe(old))
      await expectLiveStreams(0, 1)
      expect(nodes[0].getConnections(nodes[1].peerId)).toEqual([physical])
      expect(physical.status).toBe('open')
      await expectDelivery(0, 1, `delivery after raw stream ${mode}`)
      await expectDelivery(1, 0, `reply after raw stream ${mode}`)
    }
  )

  it('does not bounce endlessly between two transports when the remote resets every replacement stream', async () => {
    await nodes[0].dial(nodes[1].getMultiaddrs())
    await expectLiveStreams(0, 1)
    await nodes[0].dial(nodes[1].getMultiaddrs(), { force: true })
    await waitForExpect(() => expect(nodes[0].getConnections(nodes[1].peerId)).toHaveLength(2))
    const remote = nodes[1].services.pubsub as unknown as {
      createInboundStream: (peer: PeerId, stream: Stream, connection: Connection) => void
    }
    const reset = jest.spyOn(remote, 'createInboundStream').mockImplementation((_peer, stream) => {
      stream.abort(new Error('Remote rejects every replacement pubsub stream'))
    })
    outgoing(0, 1)!.rawStream.abort(new Error('Initial pubsub stream failed'))
    await nodes[0].services.pubsub.publish(topic, fromString('trigger stream recovery'))
    await waitForExpect(() => expect(reset).toHaveBeenCalledTimes(2))
    // Let both real reset notifications and queue continuations drain. The
    // connection monitor and heartbeat are not involved in this retry loop.
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(reset).toHaveBeenCalledTimes(2)
    expect(nodes[0].getConnections(nodes[1].peerId)).toHaveLength(2)
  })

  it('cannot install a negotiated stream from an earlier stop/start lifetime', async () => {
    await nodes[0].dial(nodes[1].getMultiaddrs())
    await expectLiveStreams(0, 1)
    const original = nodes[0].getConnections(nodes[1].peerId)[0]
    const replacement = await nodes[0].dial(nodes[1].getMultiaddrs(), { force: true })
    const release = deferred()
    const negotiated = deferred()
    releases.push(release.resolve)
    let abandoned: Stream | undefined
    const open = replacement.newStream.bind(replacement)
    jest.spyOn(replacement, 'newStream').mockImplementationOnce(async (protocols, options) => {
      const rawStream = await open(protocols, options)
      abandoned = rawStream
      negotiated.resolve()
      await release.promise
      return rawStream
    })
    original.abort(new Error('Begin recovery before pubsub stops'))
    await negotiated.promise
    const pubsub = nodes[0].services.pubsub
    await pubsub.stop()
    expect(pubsub.streamsOutbound.size).toBe(0)
    await pubsub.start()
    pubsub.subscribe(topic)
    const registrar = (nodes[0] as unknown as { components: { registrar: Registrar } }).components.registrar
    for (const topology of registrar.getTopologies(pubsub.multicodecs[0])) {
      topology.onConnect?.(nodes[1].peerId, replacement as Connection)
    }
    await waitForExpect(() => {
      expect(outgoing(0, 1)?.rawStream.status).toBe('open')
      expect(replacement.streams).toContain(outgoing(0, 1)!.rawStream)
      expect(incoming(1, 0)?.rawStream.status).toBe('open')
    })
    const current = outgoing(0, 1)
    release.resolve()
    await waitForExpect(() => expect(abandoned?.status).toBe('closed'))
    expect(outgoing(0, 1)).toBe(current)
  })
})
