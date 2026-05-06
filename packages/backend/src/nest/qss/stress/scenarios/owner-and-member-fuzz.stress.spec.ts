/**
 * Fuzz sweep over owner+member join, with per-peer chaos.
 *
 * Each member harness allocates its own toxiproxy listener (default for
 * `bootMemberHarness`). The canonical single-peer catalog is lifted via
 * `memberOnly()` — chaos lands on the MEMBER's proxy only, matching the
 * legacy single-shared-proxy semantics for this spec: owner setup runs
 * healthy, chaos applies to the member's connect / sign-in / AUTH_SYNC
 * phases. This preserves the 22/22 baseline.
 *
 * Per-peer asymmetric scenarios live in
 * `owner-and-member-asymmetric.stress.spec.ts` — they exercise owner
 * vs. member differences explicitly. The harness supports per-peer
 * profiles via the `profile.owner` / `profile.member` fields here too;
 * `runOwnerThenMember` will respect anything the caller passes.
 *
 * Fails when member's auth conn doesn't reach JOINED within a generous
 * timeout, when invariants (unhandled rejections, leaked timers) trip,
 * or when the connection times out.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, bootMemberHarness, generateOwnerInvite, type QssHarness } from '../harness'
import {
  Invariants,
  expectQssConnectedWithin,
  snapshotMultiPeerAuthConn,
  formatMultiPeerSnapshot,
} from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'
import {
  CHAOS_PROFILES,
  type ChaosProfile,
  type FlapWindow,
  type MultiPeerChaosProfile,
  type OutageWindow,
  type PeerChaos,
  type ScenarioPhase,
  type ScenarioResult,
  fingerprintError,
  makeRng,
  randomProfile,
  memberOnly,
} from '../fuzz'

jest.setTimeout(240_000)

const FUZZ_RUNS = Number(process.env.STRESS_FUZZ_RUNS ?? '0')
const FUZZ_BASE_SEED = Number(process.env.STRESS_FUZZ_SEED ?? Date.now())
const RESULTS_PATH = process.env.STRESS_RESULTS_PATH

const allResults: ScenarioResult[] = []

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

async function applyToxics(harness: QssHarness, peer: PeerChaos | undefined): Promise<void> {
  if (peer?.toxics == null) return
  for (const toxic of peer.toxics) {
    await harness.toxiproxy.addToxic(harness.proxyName, toxic).catch(() => undefined)
  }
}

async function maybeOutage(
  harness: QssHarness,
  peer: PeerChaos | undefined,
  phase: ScenarioPhase
): Promise<void> {
  if (peer == null) return
  for (const outage of (peer.outages ?? []).filter(o => o.at === phase)) {
    await scheduleOutage(harness, outage)
  }
  for (const flap of (peer.flaps ?? []).filter(f => f.at === phase)) {
    await scheduleFlap(harness, flap)
  }
}

async function scheduleOutage(harness: QssHarness, outage: OutageWindow): Promise<void> {
  await harness.toxiproxy.setEnabled(harness.proxyName, false).catch(() => undefined)
  await sleep(outage.durationMs)
  await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
  await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)
}

async function scheduleFlap(harness: QssHarness, flap: FlapWindow): Promise<void> {
  const start = Date.now()
  let enabled = true
  while (Date.now() - start < flap.totalMs) {
    enabled = !enabled
    await harness.toxiproxy.setEnabled(harness.proxyName, enabled).catch(() => undefined)
    await sleep(flap.cycleMs)
  }
  await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
  await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)
}

async function runOwnerThenMember(profile: MultiPeerChaosProfile, seed: number): Promise<ScenarioResult> {
  const start = Date.now()
  const invariants = new Invariants()
  let owner: QssHarness | undefined
  let member: QssHarness | undefined
  let outcome: 'success' | 'error' = 'success'
  let errorMessage: string | undefined
  let errorFingerprint: string | undefined
  let connStatus: string | undefined
  let joinStatus: string | undefined

  try {
    // ── Owner: healthy until invite is generated ───────────────────────
    // Even if profile.owner has chaos, we apply it AFTER the owner has
    // created the community. Otherwise every owner-side toxic blocks the
    // baseline of "owner is set up, here is an invite", which is not the
    // failure mode we're trying to test.
    owner = await bootQssHarness({ username: `owner-${seed}`, teamName: `team-${seed}` })
    invariants.start()
    owner.primeCaptcha()
    await owner.qssService.connect(owner.qssEndpoint, true)
    await expectQssConnectedWithin(owner, 30_000)
    const ownerTeamId = owner.sigchainService.activeChain.team!.id
    await waitForExpect(async () => {
      const status = await owner!.qssService.getQssInitStatus()
      if (!status.qssSetup) throw new Error('owner qssSetup still false')
    }, 30_000)
    await waitForExpect(() => {
      const conn = owner!.qssAuthConnManager.getConnection(ownerTeamId)
      if (conn?.connStatus !== QSSAuthConnStatus.CONNECTED) throw new Error('owner auth conn not CONNECTED')
    }, 30_000)
    const invite = generateOwnerInvite(owner)

    // ── Apply per-peer toxics ──────────────────────────────────────────
    // Owner toxics on the owner's proxy; member toxics on the member's.
    // Each harness has its own listener now, so no leak across peers.
    await applyToxics(owner, profile.owner)

    member = await bootMemberHarness({ invite, username: `member-${seed}` })
    await applyToxics(member, profile.member)

    // ── Owner-side outages (run in background; member proceeds) ────────
    // Owner outages line up with the same phase labels as the member's,
    // but they fire against the owner's proxy. Run them concurrently
    // with the member's flow to model real "owner's link drops while
    // member is joining" cases.
    const ownerPhases: Promise<void>[] = []
    for (const phase of ['preCaptcha', 'preCreate', 'duringAuthSync'] as ScenarioPhase[]) {
      ownerPhases.push(maybeOutage(owner, profile.owner, phase))
    }

    await maybeOutage(member, profile.member, 'preConnect')
    member.primeCaptcha()
    await member.qssService.connect(member.qssEndpoint, true)
    await expectQssConnectedWithin(member, 60_000)

    await maybeOutage(member, profile.member, 'preCaptcha')
    await maybeOutage(member, profile.member, 'preCreate')

    await maybeOutage(member, profile.member, 'duringAuthSync')

    await waitForExpect(() => {
      const conn = member!.qssAuthConnManager.getConnection(invite.teamId)
      if (conn == null) throw new Error('member auth connection not present')
      if (conn.connStatus !== QSSAuthConnStatus.CONNECTED) {
        throw new Error(`member auth connStatus=${conn.connStatus}`)
      }
      if (conn.joinStatus !== JoinStatus.JOINED) {
        throw new Error(`member auth joinStatus=${conn.joinStatus}`)
      }
    }, 90_000)

    // Drain any owner-side outage tasks that haven't already settled.
    await Promise.allSettled(ownerPhases)

    const conn = member.qssAuthConnManager.getConnection(invite.teamId)
    connStatus = conn?.connStatus
    joinStatus = conn?.joinStatus
  } catch (e) {
    outcome = 'error'
    errorMessage = e instanceof Error ? e.message : String(e)
    errorFingerprint = fingerprintError(e)
    if (owner != null && member != null) {
      const teamId = owner.sigchainService.activeChain.team!.id
      const snap = snapshotMultiPeerAuthConn(owner, member, teamId)
      errorMessage = `${errorMessage} | ${formatMultiPeerSnapshot(snap)}`
    }
  } finally {
    const snap = invariants.stop()
    if (outcome === 'success' && (snap.unhandledRejections.length > 0 || snap.uncaughtExceptions.length > 0)) {
      outcome = 'error'
      errorMessage = `process-level errors: ${snap.unhandledRejections.length} rejection(s), ${snap.uncaughtExceptions.length} exception(s)`
      errorFingerprint = fingerprintError(snap.unhandledRejections[0] ?? snap.uncaughtExceptions[0])
    }

    // Match the legacy single-peer ChaosProfile shape so summarize/result
    // bucketing still works.
    const flatProfile: ChaosProfile = {
      name: profile.name,
      toxics: [...(profile.owner?.toxics ?? []), ...(profile.member?.toxics ?? [])],
      outages: [...(profile.owner?.outages ?? []), ...(profile.member?.outages ?? [])],
      flaps: [...(profile.owner?.flaps ?? []), ...(profile.member?.flaps ?? [])],
    }
    const result: ScenarioResult = {
      seed,
      profile: flatProfile,
      outcome,
      errorMessage,
      errorFingerprint,
      durationMs: Date.now() - start,
      finalState: {
        qssSetup: true, // owner setup, by construction here
        connStatus,
        joinStatus,
        activeTimers: snap.activeTimers,
        unhandledRejections: snap.unhandledRejections.length,
      },
    }
    allResults.push(result)
    if (member != null) await member.shutdown().catch(() => undefined)
    if (owner != null) await owner.shutdown().catch(() => undefined)
    return result
  }
}

const fuzzCases: Array<[string, MultiPeerChaosProfile, number]> = []
const baseRng = makeRng(FUZZ_BASE_SEED)
for (let i = 0; i < FUZZ_RUNS; i++) {
  const seed = (FUZZ_BASE_SEED + i) | 0
  const profile = randomProfile(makeRng(seed), seed)
  // Random profiles are single-peer; lift to memberOnly so they
  // exercise just the member's link (matches the legacy semantics
  // where chaos was applied during the member's flow only).
  fuzzCases.push([profile.name, memberOnly(profile), seed])
}

describe('QSS stress: fuzz sweep over owner+member join', () => {
  it.each(
    CHAOS_PROFILES.map((p): [string, MultiPeerChaosProfile, number] => [p.name, memberOnly(p), 0])
  )('profile %s', async (_name, profile, seed) => {
    const result = await runOwnerThenMember(profile, seed)
    if (result.outcome !== 'success') {
      throw new Error(
        `[${profile.name} seed=${seed}] ${result.errorMessage}\n` +
          `  finalState=${JSON.stringify(result.finalState)}`
      )
    }
  })

  if (fuzzCases.length > 0) {
    it.each(fuzzCases)('random-fuzz %s', async (_name, profile, seed) => {
      const result = await runOwnerThenMember(profile, seed)
      if (result.outcome !== 'success') {
        throw new Error(
          `[${profile.name} seed=${seed}] ${result.errorMessage}\n` +
            `  owner-toxics=${JSON.stringify(profile.owner?.toxics ?? [])}\n` +
            `  owner-outages=${JSON.stringify(profile.owner?.outages ?? [])}\n` +
            `  owner-flaps=${JSON.stringify(profile.owner?.flaps ?? [])}\n` +
            `  member-toxics=${JSON.stringify(profile.member?.toxics ?? [])}\n` +
            `  member-outages=${JSON.stringify(profile.member?.outages ?? [])}\n` +
            `  member-flaps=${JSON.stringify(profile.member?.flaps ?? [])}\n` +
            `  finalState=${JSON.stringify(result.finalState)}`
        )
      }
    })
  }

  afterAll(() => {
    if (RESULTS_PATH != null) {
      fs.mkdirSync(path.dirname(RESULTS_PATH), { recursive: true })
      fs.writeFileSync(RESULTS_PATH, JSON.stringify(allResults, null, 2))
    }
    summarize(allResults)
  })
})

function summarize(results: ScenarioResult[]): void {
  const total = results.length
  const failures = results.filter(r => r.outcome !== 'success')
  if (total === 0) return

  // eslint-disable-next-line no-console
  console.log(
    `\n[stress-summary] ${total - failures.length}/${total} succeeded, ${failures.length} failed`
  )

  if (failures.length === 0) return

  const buckets = new Map<string, ScenarioResult[]>()
  for (const f of failures) {
    const key = f.errorFingerprint ?? 'unknown'
    const arr = buckets.get(key) ?? []
    arr.push(f)
    buckets.set(key, arr)
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1].length - a[1].length)
  for (const [fingerprint, fs] of sorted) {
    const repro = fs.reduce((min, f) => (f.seed < min.seed ? f : min))
    // eslint-disable-next-line no-console
    console.log(
      `  [${fs.length}x] ${fingerprint}\n` +
        `    smallest-seed repro: seed=${repro.seed} profile=${repro.profile.name}`
    )
  }
}
