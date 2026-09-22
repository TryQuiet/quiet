import { jest } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import { pipe } from 'it-pipe'
import waitForExpect from 'wait-for-expect'

import { SigChainService } from '../../auth/sigchain.service'
import { spawnLibp2pInstancesInMemory, spawnTestModules } from '../../common/test-utils'
import { Libp2pService } from '../libp2p.service'
import { Libp2pEvents } from '../libp2p.types'

describe('connection monitoring over a slow transport', () => {
  let modules: TestingModule[] = []

  afterEach(async () => {
    jest.restoreAllMocks()
    for (const module of modules) {
      await (await module.resolve(Libp2pService)).close()
      await module.close()
    }
    modules = []
  })

  it('keeps an authenticated connection alive when a heartbeat takes more than two seconds', async () => {
    modules = await spawnTestModules(2)
    const chainA = await modules[0].resolve(SigChainService)
    const chainB = await modules[1].resolve(SigChainService)
    const libp2pA = await modules[0].resolve(Libp2pService)
    const libp2pB = await modules[1].resolve(Libp2pService)
    const chain = await chainA.createChain(true)
    const invite = chain.invites.createLongLivedUserInvite()
    await chainB.createChainFromInvite({ seed: invite.seed }, chain.teamId!, true)
    await spawnLibp2pInstancesInMemory(modules)

    let joined = false
    libp2pB.on(Libp2pEvents.AUTH_JOINED, () => {
      joined = true
    })
    await libp2pB.dialPeer(libp2pA.localAddress)
    await waitForExpect(() => expect(joined).toBe(true), 15_000)

    const nodeA = libp2pA.libp2pInstance!
    const nodeB = libp2pB.libp2pInstance!
    await nodeB.unhandle('/ipfs/ping/1.0.0')
    await nodeB.handle('/ipfs/ping/1.0.0', ({ stream }) => {
      // Exercise real protocol negotiation and stream I/O with a Tor-like delay.
      void pipe(
        stream,
        async function* (source) {
          for await (const chunk of source) {
            await new Promise(resolve => setTimeout(resolve, 3_500))
            yield chunk
          }
        },
        stream
      ).catch(error => stream.abort(error))
    })

    // Trigger the actual production monitor once without waiting a full minute.
    // Keep real clocks, transports and the configured ping deadline.
    const monitor = (nodeA as any).components.connectionMonitor
    monitor.stop()
    let heartbeat: (() => void) | undefined
    const setInterval = global.setInterval
    const intervalSpy = jest.spyOn(global, 'setInterval').mockImplementationOnce((callback, delay, ...args) => {
      heartbeat = callback as () => void
      return setInterval(callback, delay, ...args)
    })
    monitor.start()
    intervalSpy.mockRestore()
    const connection = nodeA.getConnections(nodeB.peerId)[0]
    expect(connection.status).toBe('open')
    expect(heartbeat).toBeDefined()
    heartbeat!()

    await waitForExpect(() => {
      expect(connection.status).toBe('open')
      expect(connection.rtt).toBeGreaterThanOrEqual(3_500)
    }, 10_000)
    expect(nodeA.getConnections(nodeB.peerId)).toContain(connection)
  })
})
