/**
 * Fuzz sweep over fresh-create-community.
 *
 * Every iteration boots a fresh harness, applies a chaos profile, runs the
 * full setup sequence, and records the outcome. The canonical catalog in
 * fuzz.ts runs by default; randomized profiles run additionally when
 * STRESS_FUZZ_RUNS is set.
 *
 * Failure messages are tagged with the seed and profile name; the same seed
 * always reproduces the same toxic configuration. After all cases run, an
 * aggregated summary groups failures by error fingerprint and prints the
 * smallest-seed repro per bucket. With STRESS_RESULTS_PATH set, the full
 * result list is written as JSON to that path for offline triage.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { jest } from '@jest/globals'
import waitForExpect from 'wait-for-expect'

import { bootQssHarness, type QssHarness } from '../harness'
import { Invariants, expectQssConnectedWithin } from '../invariants'
import { QSSAuthConnStatus } from '../../qss.const'
import { JoinStatus } from '../../../libp2p/libp2p.auth'
import {
  CHAOS_PROFILES,
  type ChaosProfile,
  type FlapWindow,
  type OutageWindow,
  type ScenarioPhase,
  type ScenarioResult,
  fingerprintError,
  makeRng,
  randomProfile,
} from '../fuzz'

jest.setTimeout(180_000)

const FUZZ_RUNS = Number(process.env.STRESS_FUZZ_RUNS ?? '0')
const FUZZ_BASE_SEED = Number(process.env.STRESS_FUZZ_SEED ?? Date.now())
const RESULTS_PATH = process.env.STRESS_RESULTS_PATH

const allResults: ScenarioResult[] = []

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

async function applyToxics(harness: QssHarness, profile: ChaosProfile): Promise<void> {
  if (profile.toxics == null) return
  for (const toxic of profile.toxics) {
    await harness.toxiproxy.addToxic(harness.proxyName, toxic)
  }
}

async function maybeOutage(
  harness: QssHarness,
  profile: ChaosProfile,
  phase: ScenarioPhase
): Promise<void> {
  for (const outage of (profile.outages ?? []).filter(o => o.at === phase)) {
    await scheduleOutage(harness, outage)
  }
  for (const flap of (profile.flaps ?? []).filter(f => f.at === phase)) {
    await scheduleFlap(harness, flap)
  }
}

async function scheduleOutage(harness: QssHarness, outage: OutageWindow): Promise<void> {
  await harness.toxiproxy.setEnabled(harness.proxyName, false)
  await sleep(outage.durationMs)
  await harness.toxiproxy.setEnabled(harness.proxyName, true)
  // After bringing the proxy back, the QSS service may have a torn socket.
  // Drive an explicit reconnect so the scenario doesn't have to wait the
  // QSS_RECONNECT_DELAY_MS interval.
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
  // Always finish in the enabled state.
  await harness.toxiproxy.setEnabled(harness.proxyName, true).catch(() => undefined)
  await harness.qssService.connect(harness.qssEndpoint, true).catch(() => undefined)
}

async function runFreshCreate(profile: ChaosProfile, seed: number): Promise<ScenarioResult> {
  const start = Date.now()
  const invariants = new Invariants()
  let harness: QssHarness | undefined
  let outcome: 'success' | 'error' = 'success'
  let errorMessage: string | undefined
  let errorFingerprint: string | undefined
  let connStatus: string | undefined
  let joinStatus: string | undefined
  let qssSetup = false

  try {
    harness = await bootQssHarness()
    invariants.start()

    // Prime before any chaos so the auto-create (driven by QSS_CONNECTED →
    // QSS_HANDLE_SIGN_IN) has the captcha cached.
    harness.primeCaptcha()
    await applyToxics(harness, profile)

    await maybeOutage(harness, profile, 'preConnect')
    await harness.qssService.connect(harness.qssEndpoint, true)
    await expectQssConnectedWithin(harness, 30_000)

    // pre-captcha / pre-create outages happen *between* phases of the
    // auto-flow that's already running. We don't have hooks into those
    // phases, so we treat the outage as overlapping noise that the service
    // must recover from.
    await maybeOutage(harness, profile, 'preCaptcha')
    await maybeOutage(harness, profile, 'preCreate')

    const sigchain = harness.sigchainService.activeChain
    const teamId = sigchain.team!.id

    await waitForExpect(async () => {
      const status = await harness!.qssService.getQssInitStatus()
      if (!status.qssSetup) throw new Error('qssSetup still false')
    }, 60_000)

    await maybeOutage(harness, profile, 'duringAuthSync')

    await waitForExpect(() => {
      const conn = harness!.qssAuthConnManager.getConnection(teamId)
      if (conn == null) throw new Error('auth connection not present')
      if (conn.connStatus !== QSSAuthConnStatus.CONNECTED) {
        throw new Error(`auth connStatus=${conn.connStatus}`)
      }
      if (conn.joinStatus !== JoinStatus.JOINED) {
        throw new Error(`auth joinStatus=${conn.joinStatus}`)
      }
    }, 60_000)

    qssSetup = (await harness.qssService.getQssInitStatus()).qssSetup
    const conn = harness.qssAuthConnManager.getConnection(teamId)
    connStatus = conn?.connStatus
    joinStatus = conn?.joinStatus
  } catch (e) {
    outcome = 'error'
    errorMessage = e instanceof Error ? e.message : String(e)
    errorFingerprint = fingerprintError(e)
  } finally {
    const snap = invariants.stop()
    if (outcome === 'success' && (snap.unhandledRejections.length > 0 || snap.uncaughtExceptions.length > 0)) {
      outcome = 'error'
      errorMessage = `process-level errors: ${snap.unhandledRejections.length} rejection(s), ${snap.uncaughtExceptions.length} exception(s)`
      errorFingerprint = fingerprintError(snap.unhandledRejections[0] ?? snap.uncaughtExceptions[0])
    }

    const result: ScenarioResult = {
      seed,
      profile,
      outcome,
      errorMessage,
      errorFingerprint,
      durationMs: Date.now() - start,
      finalState: {
        qssSetup,
        connStatus,
        joinStatus,
        activeTimers: snap.activeTimers,
        unhandledRejections: snap.unhandledRejections.length,
      },
    }
    allResults.push(result)
    if (harness != null) await harness.shutdown().catch(() => undefined)
    return result
  }
}

const fuzzCases: Array<[string, ChaosProfile, number]> = []
const rng = makeRng(FUZZ_BASE_SEED)
for (let i = 0; i < FUZZ_RUNS; i++) {
  const seed = (FUZZ_BASE_SEED + i) | 0
  const profile = randomProfile(makeRng(seed), seed)
  fuzzCases.push([profile.name, profile, seed])
}

describe('QSS stress: fuzz sweep over fresh community creation', () => {
  it.each(CHAOS_PROFILES.map((p, i): [string, ChaosProfile, number] => [p.name, p, 0]))(
    'profile %s',
    async (_name, profile, seed) => {
      const result = await runFreshCreate(profile, seed)
      if (result.outcome !== 'success') {
        throw new Error(
          `[${profile.name} seed=${seed}] ${result.errorMessage}\n` +
            `  finalState=${JSON.stringify(result.finalState)}`
        )
      }
    }
  )

  if (fuzzCases.length > 0) {
    it.each(fuzzCases)('random-fuzz %s', async (_name, profile, seed) => {
      const result = await runFreshCreate(profile, seed)
      if (result.outcome !== 'success') {
        throw new Error(
          `[${profile.name} seed=${seed}] ${result.errorMessage}\n` +
            `  toxics=${JSON.stringify(profile.toxics ?? [])}\n` +
            `  outages=${JSON.stringify(profile.outages ?? [])}\n` +
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
