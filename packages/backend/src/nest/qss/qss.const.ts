export const CLIENT_TRANSPORTS = ['websocket']
export const QSS_RECONNECT_DELAY_MS = 50
export const QSS_RECONNECT_MAX_DELAY_MS = 60_000
export const QSS_RECONNECT_BACKOFF_FACTOR = 2

/**
 * Per-attempt deadline for the socket.io handshake to finish (`connect` event
 * fires) before `QSSClient._waitForConnect` rejects and the QSS service
 * schedules another attempt.
 *
 * 7.1.0 hardcoded this to 10 s. Under combined high downstream latency
 * (4-5 s) and partial upstream `reset_peer`, a single WebSocket handshake can
 * legitimately need 11-15 s — and even when it could complete in time, a
 * mid-handshake RST forces a fresh attempt with no time left in the budget.
 * The QSS stress sweep on 7.1.0 hit this in two cases of a 52-case run.
 *
 * 30 s gives a single handshake enough headroom to ride out one full retry
 * inside the same `_waitForConnect` and is consistent with socket.io's own
 * default `timeout` (20 s) plus a small margin for the slow-network case.
 *
 * Override with the QSS_HANDSHAKE_TIMEOUT_MS env var if a deployment wants to
 * tighten or further widen it. Values are clamped to a minimum of 1 s to
 * avoid accidentally disabling the timer.
 */
export const QSS_HANDSHAKE_TIMEOUT_MS = Math.max(
  1_000,
  Number(process.env.QSS_HANDSHAKE_TIMEOUT_MS ?? 30_000) || 30_000
)

export enum QSSAuthConnStatus {
  NOT_STARTED = 'NOT_STARTED',
  INACTIVE = 'INACTIVE',
  STARTING = 'STARTING',
  CONNECTED = 'CONNECTED',
}
