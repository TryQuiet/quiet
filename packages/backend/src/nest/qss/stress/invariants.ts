/**
 * Probes and assertions used by stress scenarios. The point is to catch the
 * bug shapes that have actually shown up in QSS connect/reconnect/leave
 * commits — orphan timers, unhandled rejections, stuck state machines, DLQs
 * that never drain.
 */
import type { QssHarness } from './harness'
import { QSSAuthConnStatus } from '../qss.const'
import { JoinStatus } from '../../libp2p/libp2p.auth'

export interface InvariantSnapshot {
  unhandledRejections: unknown[]
  uncaughtExceptions: unknown[]
  activeResources: string[]
  activeTimers: number
}

/**
 * Capture process-level signals during a scenario. Construct, call start(),
 * run the scenario, then call stop() to read the snapshot.
 */
export class Invariants {
  private rejections: unknown[] = []
  private exceptions: unknown[] = []
  private rejectionListener = (reason: unknown): void => {
    this.rejections.push(reason)
  }
  private exceptionListener = (err: Error): void => {
    this.exceptions.push(err)
  }

  start(): void {
    this.rejections = []
    this.exceptions = []
    process.on('unhandledRejection', this.rejectionListener)
    process.on('uncaughtException', this.exceptionListener)
  }

  stop(): InvariantSnapshot {
    process.off('unhandledRejection', this.rejectionListener)
    process.off('uncaughtException', this.exceptionListener)
    const activeResources = (process as unknown as { getActiveResourcesInfo?: () => string[] }).getActiveResourcesInfo?.() ?? []
    const activeTimers = activeResources.filter(r => r === 'Timeout' || r === 'Immediate').length
    return {
      unhandledRejections: [...this.rejections],
      uncaughtExceptions: [...this.exceptions],
      activeResources,
      activeTimers,
    }
  }

  static expectClean(snap: InvariantSnapshot): void {
    if (snap.unhandledRejections.length > 0) {
      throw new Error(
        `Unhandled rejection(s) during scenario:\n${snap.unhandledRejections.map(r => formatReason(r)).join('\n')}`
      )
    }
    if (snap.uncaughtExceptions.length > 0) {
      throw new Error(
        `Uncaught exception(s) during scenario:\n${snap.uncaughtExceptions.map(r => formatReason(r)).join('\n')}`
      )
    }
  }
}

const formatReason = (r: unknown): string => {
  if (r instanceof Error) return r.stack ?? r.message
  try {
    return JSON.stringify(r)
  } catch {
    return String(r)
  }
}

/** Poll until QSS reports `connected`, or throw after timeoutMs. */
export async function expectQssConnectedWithin(harness: QssHarness, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (harness.qssService.connected) return
    await sleep(100)
  }
  throw new Error(`QSS did not reach connected within ${timeoutMs}ms`)
}

/** Poll until QSS reports `connected === false`, or throw after timeoutMs. */
export async function expectQssDisconnectedWithin(harness: QssHarness, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!harness.qssService.connected) return
    await sleep(100)
  }
  throw new Error(`QSS did not disconnect within ${timeoutMs}ms`)
}

export interface AuthConnSnapshot {
  connStatus: QSSAuthConnStatus
  joinStatus: JoinStatus
  active: boolean
}

export function snapshotAuthConn(harness: QssHarness, teamId: string): AuthConnSnapshot | null {
  const conn = harness.qssAuthConnManager.getConnection(teamId)
  if (conn == null) return null
  return {
    connStatus: conn.connStatus,
    joinStatus: conn.joinStatus,
    active: conn.active,
  }
}

/**
 * Combined snapshot of both peers' auth-conn states for a multi-client
 * scenario. When a per-peer chaos run fails, this makes failures
 * unambiguous about which side stalled (e.g. "owner CONNECTED+JOINED,
 * member DISCONNECTED+SYNCING" points at the member-side link as the
 * stuck one).
 */
export interface MultiPeerAuthSnapshot {
  owner: AuthConnSnapshot | null
  member: AuthConnSnapshot | null
}

export function snapshotMultiPeerAuthConn(
  owner: QssHarness | undefined,
  member: QssHarness | undefined,
  teamId: string
): MultiPeerAuthSnapshot {
  return {
    owner: owner != null ? snapshotAuthConn(owner, teamId) : null,
    member: member != null ? snapshotAuthConn(member, teamId) : null,
  }
}

/**
 * Render a multi-peer auth-conn snapshot as a one-liner suitable for
 * test failure messages. Example:
 *   "owner=CONNECTED/JOINED member=DISCONNECTED/SYNCING"
 */
export function formatMultiPeerSnapshot(snap: MultiPeerAuthSnapshot): string {
  const fmt = (s: AuthConnSnapshot | null): string =>
    s == null ? 'absent' : `${s.connStatus}/${s.joinStatus}${s.active ? '' : '(inactive)'}`
  return `owner=${fmt(snap.owner)} member=${fmt(snap.member)}`
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
