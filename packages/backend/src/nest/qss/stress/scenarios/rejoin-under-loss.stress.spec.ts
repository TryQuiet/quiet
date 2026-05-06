/**
 * Smallest end-to-end scenario for the QSS stress harness.
 *
 * Verifies the harness boots, reaches a real QSS server through Toxiproxy,
 * survives a brief network outage, and re-establishes the connection.
 *
 * Requires: `npm run start:qss` (QSS at host:3003) and the toxiproxy sidecar
 * running (see this directory's docker-compose.yml).
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin, expectQssDisconnectedWithin } from '../invariants'

jest.setTimeout(180_000)

describe('QSS stress: rejoin under loss', () => {
  let harness: QssHarness
  let invariants: Invariants

  beforeAll(async () => {
    harness = await bootQssHarness()
  })

  afterAll(async () => {
    if (harness != null) await harness.shutdown()
  })

  beforeEach(() => {
    invariants = new Invariants()
    invariants.start()
  })

  afterEach(async () => {
    await harness.toxiproxy.clearToxics(harness.proxyName).catch(() => undefined)
    await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
  })

  it('reaches CONNECTED through a healthy proxy', async () => {
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 15_000)
    expect(harness.qssService.connected).toBe(true)

    Invariants.expectClean(invariants.stop())
  })

  it('reconnects after a forced proxy outage', async () => {
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 15_000)

    // disable the proxy — existing TCP connections get reset
    await harness.toxiproxy.setEnabled(harness.proxyName, false)
    await expectQssDisconnectedWithin(harness, 15_000)

    // re-enable and request reconnect; the in-process retry interval is 60s
    // (QSS_RECONNECT_DELAY_MS) so prod paths would just wait — for a tight
    // test we drive connect() directly.
    await harness.toxiproxy.setEnabled(harness.proxyName, true)
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    Invariants.expectClean(invariants.stop())
  })

  it('connects despite high inbound latency on the handshake', async () => {
    await harness.toxiproxy.addToxic(harness.proxyName, {
      name: 'handshake-latency',
      type: 'latency',
      stream: 'downstream',
      toxicity: 1.0,
      attributes: { latency: 600, jitter: 200 },
    })

    await harness.qssService.connect(harness.qssEndpoint, true)
    await waitForExpect(() => {
      expect(harness.qssService.connected).toBe(true)
    }, 30_000)

    await harness.toxiproxy.removeToxic(harness.proxyName, 'handshake-latency')

    Invariants.expectClean(invariants.stop())
  })
})
