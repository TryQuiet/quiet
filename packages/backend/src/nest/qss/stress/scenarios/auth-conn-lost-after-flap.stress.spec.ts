/**
 * PoC: auth connection lost after flap during AUTH_SYNC.
 *
 * Bucket from a 50-seed fuzz sweep against 7.1.0 (smallest-seed repro: seed=333,
 * profile `random-seed-333`):
 *
 *   "auth connection not present" — 4 occurrences in 50 runs.
 *
 * Profile (verbatim from `randomProfile(makeRng(333), 333)`):
 *   toxics: high latency + jitter + 64 kbps bandwidth, downstream
 *   outages: 2641 ms preCreate
 *   flaps: 4628 ms of 395 ms-cycle on/off during duringAuthSync
 *
 * The user-visible symptom: a fresh community owner finishes CREATE_COMMUNITY
 * (`qssSetup` becomes true on disk) and then the LFA auth handshake never
 * recovers — the join screen sits forever even after the network steadies.
 *
 * Failure trace from the harness (`fuzz-create-community.stress.spec.ts:130-139`):
 *   Error: auth connection not present
 *     finalState={qssSetup:true, connStatus:undefined, joinStatus:undefined}
 *
 * This spec applies the same chaos profile deterministically, asserts the
 * same invariant the fuzz harness asserts (`getConnection(teamId)` reaches
 * CONNECTED + JOINED within 60s after the flap settles), and prints
 * lifecycle telemetry to make the failure diagnosable.
 */
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'
import { QSSEvents } from '../../qss.types'

jest.setTimeout(240_000)

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

interface AuthConnEvent {
  ts: number
  kind:
    | 'startAuthConn-emitted'
    | 'startNewConnection-called'
    | 'startNewConnection-error'
    | 'startNewConnection-ok'
    | 'auth-conn-disconnected'
    | 'qss-disconnected'
    | 'qss-connected'
    | 'handle-sign-in'
    | 'auth-conn-set'
    | 'auth-conn-deleted'
  detail?: string
}

describe('QSS stress PoC: auth connection lost after flap during AUTH_SYNC (seed=333)', () => {
  let harness: QssHarness
  let invariants: Invariants

  beforeEach(async () => {
    harness = await bootQssHarness()
    invariants = new Invariants()
    invariants.start()
  })

  afterEach(async () => {
    if (harness != null) await harness.shutdown()
  })

  it('reaches CONNECTED+JOINED after a 4.6s flap during AUTH_SYNC (seed=333 repro)', async () => {
    const events: AuthConnEvent[] = []
    const t0 = Date.now()
    const log = (kind: AuthConnEvent['kind'], detail?: string): void => {
      events.push({ ts: Date.now() - t0, kind, detail })
    }

    // ── observability: hook the auth-conn-manager and qss-client lifecycles
    harness.qssService.on(QSSEvents.QSS_START_AUTH_CONN, (teamId: string) => {
      log('startAuthConn-emitted', teamId)
    })
    harness.qssService.on(QSSEvents.QSS_HANDLE_SIGN_IN, () => {
      log('handle-sign-in')
    })
    harness.qssClient.on(QSSEvents.QSS_CONNECTED, () => log('qss-connected'))
    harness.qssClient.on(QSSEvents.QSS_DISCONNECTED, () => log('qss-disconnected'))

    // wrap startNewConnection so we can see when it errors vs. succeeds
    const mgr = harness.qssAuthConnManager as unknown as {
      startNewConnection: (teamId: string, teamName?: string) => Promise<void>
      authConnMap: Map<string, unknown>
    }
    const originalStart = mgr.startNewConnection.bind(harness.qssAuthConnManager)
    mgr.startNewConnection = async (teamId: string, teamName?: string): Promise<void> => {
      log('startNewConnection-called', teamId)
      try {
        await originalStart(teamId, teamName)
        log('startNewConnection-ok', teamId)
      } catch (e) {
        log('startNewConnection-error', e instanceof Error ? e.message : String(e))
        throw e
      }
    }

    // wrap the authConnMap so we can see set/delete activity
    const realMap = mgr.authConnMap
    const wrappedSet = realMap.set.bind(realMap)
    const wrappedDelete = realMap.delete.bind(realMap)
    realMap.set = (k: any, v: any) => {
      log('auth-conn-set', String(k))
      return wrappedSet(k, v)
    }
    realMap.delete = (k: any) => {
      log('auth-conn-deleted', String(k))
      return wrappedDelete(k)
    }

    // ── the seed=333 chaos profile: latency + bandwidth ambient,
    //    a 2641 ms outage at preCreate, and a 4628 ms flap (395 ms cycle)
    //    during AUTH_SYNC.
    await harness.toxiproxy.addToxic(harness.proxyName, {
      name: 'lat',
      type: 'latency',
      stream: 'downstream',
      toxicity: 0.626,
      attributes: { latency: 1429, jitter: 1418 },
    })
    await harness.toxiproxy.addToxic(harness.proxyName, {
      name: 'bw',
      type: 'bandwidth',
      stream: 'downstream',
      toxicity: 1,
      attributes: { rate: 64 },
    })

    // ── Phase 0: prime captcha and connect.
    harness.primeCaptcha()
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    // ── Phase preCreate: 2641 ms outage. The QSSService's auto-flow may be
    //    in the middle of GEN_PUB_KEYS or CREATE_COMMUNITY when the proxy goes
    //    away; harness mimics fuzz-create-community.stress.spec.ts's behaviour.
    await harness.toxiproxy.setEnabled(harness.proxyName, false)
    await sleep(2641)
    await harness.toxiproxy.setEnabled(harness.proxyName, true)
    // explicit reconnect so we don't wait the QSS_RECONNECT_DELAY_MS interval
    await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)

    const sigchain = harness.sigchainService.activeChain
    const teamId = sigchain.team!.id

    // Wait for qssSetup → true. This is the same gate the fuzz harness uses
    // before kicking off the AUTH_SYNC-phase flap.
    await waitForExpect(async () => {
      const status = await harness.qssService.getQssInitStatus()
      if (!status.qssSetup) throw new Error('qssSetup still false')
    }, 90_000)

    log('qss-disconnected', `qssSetup=true; about to flap`)

    // ── Phase duringAuthSync: 4628 ms flap, 395 ms cycle. While this runs the
    //    QSS auth conn is mid-LFA-handshake. Each flap-down disconnects the
    //    websocket, which fires _onQssDisconnected → stop() on the auth conn,
    //    AND _handleQssClientDisconnected on the manager → close(false) → the
    //    teamId entry is deleted from authConnMap.
    const flapStart = Date.now()
    let enabled = true
    while (Date.now() - flapStart < 4628) {
      enabled = !enabled
      await harness.toxiproxy.setEnabled(harness.proxyName, enabled).catch(() => undefined)
      await sleep(395)
    }
    await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
    await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)

    // ── Recovery window. Same assertion runFreshCreate makes in
    //    fuzz-create-community.stress.spec.ts:130. We extend the wait so
    //    "stuck forever" is distinguished from "slow recovery".
    let lastErr: string | undefined
    try {
      await waitForExpect(() => {
        const conn = harness.qssAuthConnManager.getConnection(teamId)
        if (conn == null) throw new Error('auth connection not present')
        if (conn.connStatus !== QSSAuthConnStatus.CONNECTED) {
          throw new Error(`auth connStatus=${conn.connStatus}`)
        }
        if (conn.joinStatus !== JoinStatus.JOINED) {
          throw new Error(`auth joinStatus=${conn.joinStatus}`)
        }
      }, 90_000)
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
    }

    // Always print the timeline so a failing run is diagnosable.
    // eslint-disable-next-line no-console
    console.log('\n[auth-conn timeline]')
    for (const ev of events) {
      // eslint-disable-next-line no-console
      console.log(`  +${ev.ts.toString().padStart(6, ' ')}ms  ${ev.kind}${ev.detail ? `  ${ev.detail}` : ''}`)
    }
    const finalConn = harness.qssAuthConnManager.getConnection(teamId)
    // eslint-disable-next-line no-console
    console.log(
      `[final state] qssClient.connected=${harness.qssClient.connected} ` +
        `qssService.connected=${harness.qssService.connected} ` +
        `authConnPresent=${finalConn != null} ` +
        `connStatus=${finalConn?.connStatus} joinStatus=${finalConn?.joinStatus}`
    )

    if (lastErr != null) {
      throw new Error(`auth conn never reached CONNECTED+JOINED: ${lastErr}`)
    }

    Invariants.expectClean(invariants.stop())
  })
})
