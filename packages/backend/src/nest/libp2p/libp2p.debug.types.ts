export interface ConnectionLifecycleDebugInfo {
  connectionId: string
  peerId: string
  direction: string
  remoteAddr: string
  status: string
  openedAtMs: number
  openedAtIso: string
  closedAtMs?: number
  closedAtIso?: string
  durationMs?: number
  closeTrigger?: string
}

export interface ConnectionHealthConfig {
  enabled: boolean
  intervalMs: number
  timeoutMs: number
  failureThreshold: number
}

export type ConnectionHealthStatus = 'healthy' | 'degraded' | 'reconnecting'

export interface ConnectionHealthDebugInfo {
  peerId: string
  status: ConnectionHealthStatus
  failureCount: number
  lastCheckedAtMs?: number
  lastSuccessAtMs?: number
  lastFailureAtMs?: number
  lastRttMs?: number
  lastErrorName?: string
  lastErrorCode?: string
  lastErrorMessage?: string
  reconnecting?: boolean
}
