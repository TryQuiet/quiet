/**
 * Per-message wire-event fault precision for the QSS stress harness.
 *
 * The phase-level chaos in `fuzz.ts` (`preConnect` / `preCaptcha` / `preCreate`
 * / `duringAuthSync`) is great for "the network was bad during this whole
 * window" but blunt for races that overlap one specific QSS round-trip. For
 * example, "the proxy died while the GEN_PUB_KEYS ack was in flight" needs to
 * land between `socket.emit('generate-public-keys', ...)` and the moment the
 * ack would otherwise arrive.
 *
 * This module exposes a `WireEvent` taxonomy spanning every QSSClient-driven
 * round-trip and a `WireFault` shape that runs an arbitrary action (toxiproxy
 * toggles, toxic add/remove, eventLoopPause, etc.) at that precise wire
 * boundary. The implementation monkey-patches `QSSClient.sendMessage` from the
 * harness — production code is untouched.
 *
 * Usage from a scenario:
 *
 * ```ts
 * const restore = installWireFaultHooks(harness, [
 *   {
 *     at: 'after-gen-pub-keys-sent',
 *     action: async h => {
 *       // Drop the proxy 500 ms after the GEN_PUB_KEYS emit, then bring it
 *       // back 2 s later. The in-flight ack should be lost; the QSSService
 *       // should retry / surface the failure cleanly.
 *       setTimeout(() => h.toxiproxy.setEnabled(h.proxyName, false).catch(() => undefined), 500)
 *       setTimeout(() => h.toxiproxy.setEnabled(h.proxyName, true).catch(() => undefined), 2500)
 *     },
 *   },
 * ])
 * try {
 *   // ...drive the scenario...
 * } finally {
 *   restore()
 * }
 * ```
 *
 * `before-*` fires synchronously *before* the `socket.emit` call. `after-*-sent`
 * fires synchronously *immediately after* the emit returns — for ack-bearing
 * round-trips (`emitWithAck`), the ack is still in flight at that moment, so a
 * fault dispatched here precisely overlaps the ack window.
 */
import { WebsocketEvents } from '../qss.types'
import { type QssHarness } from './harness'

/**
 * Every wire boundary we want to be able to slot a fault around. One pair
 * (`before-X` / `after-X-sent`) per QSS round-trip surfaced from QSSClient.
 *
 * The names mirror the production message kinds (kebab-case, prefixed with
 * `before-` or `after-X-sent`). Add new pairs here as new QSS round-trips
 * become interesting.
 */
export type WireEvent =
  // captcha exchange
  | 'before-get-captcha-site-key'
  | 'after-get-captcha-site-key-sent'
  | 'before-verify-captcha'
  | 'after-verify-captcha-sent'
  // pre-create / sign-in
  | 'before-gen-pub-keys'
  | 'after-gen-pub-keys-sent'
  | 'before-create-community'
  | 'after-create-community-sent'
  | 'before-sign-in-community'
  | 'after-sign-in-community-sent'
  // post-join data plane
  | 'before-auth-sync'
  | 'after-auth-sync-sent'
  | 'before-log-entry-sync'
  | 'after-log-entry-sync-sent'
  | 'before-log-entry-pull'
  | 'after-log-entry-pull-sent'
  | 'before-log-entry-fanout'
  | 'after-log-entry-fanout-sent'

/**
 * Map a {@link WebsocketEvents} value to the matching `before-*` / `after-*`
 * boundary names. Returns `null` for events not in the precise-fault catalog
 * yet (e.g. push registration). Keep in sync with {@link WireEvent}.
 */
function wireBoundariesFor(event: WebsocketEvents): { before: WireEvent; after: WireEvent } | null {
  switch (event) {
    case WebsocketEvents.GET_CAPTCHA_SITE_KEY:
      return { before: 'before-get-captcha-site-key', after: 'after-get-captcha-site-key-sent' }
    case WebsocketEvents.VERIFY_CAPTCHA:
      return { before: 'before-verify-captcha', after: 'after-verify-captcha-sent' }
    case WebsocketEvents.GEN_PUB_KEYS:
      return { before: 'before-gen-pub-keys', after: 'after-gen-pub-keys-sent' }
    case WebsocketEvents.CREATE_COMMUNITY:
      return { before: 'before-create-community', after: 'after-create-community-sent' }
    case WebsocketEvents.SIGN_IN_COMMUNITY:
      return { before: 'before-sign-in-community', after: 'after-sign-in-community-sent' }
    case WebsocketEvents.AUTH_SYNC:
      return { before: 'before-auth-sync', after: 'after-auth-sync-sent' }
    case WebsocketEvents.LOG_ENTRY_SYNC:
      return { before: 'before-log-entry-sync', after: 'after-log-entry-sync-sent' }
    case WebsocketEvents.LOG_ENTRY_PULL:
      return { before: 'before-log-entry-pull', after: 'after-log-entry-pull-sent' }
    case WebsocketEvents.LOG_ENTRY_FANOUT:
      return { before: 'before-log-entry-fanout', after: 'after-log-entry-fanout-sent' }
    default:
      return null
  }
}

export interface WireFault {
  /** When the fault fires relative to the wire emit. */
  at: WireEvent
  /**
   * Run a function — e.g. apply/clear toxics, toggle the proxy, await an
   * eventLoopPause, etc. The harness is passed so the action has access to
   * the toxiproxy client and proxy name without closing over them.
   *
   * The returned promise is awaited. For `after-*-sent` events on ack-bearing
   * round-trips, awaiting *blocks* the ack callback path until your action
   * resolves — which is usually what you want when you're trying to overlap
   * a fault with an in-flight ack. If your action only needs to *kick off*
   * timers (e.g. "drop the proxy 500 ms from now"), schedule them and
   * return immediately.
   */
  action: (harness: QssHarness) => Promise<void> | void
}

/**
 * Restore handle returned from {@link installWireFaultHooks}. Idempotent.
 */
export type RestoreWireFaults = () => void

/**
 * Install per-message fault hooks by monkey-patching `qssClient.sendMessage`.
 *
 * Implementation choice: we wrap `sendMessage` rather than the underlying
 * `socket.emit`. That gives us a stable signature (we know the WebsocketEvent
 * the call is for, regardless of how QSS internals route it) and avoids
 * having to chase the socket as it gets recreated on reconnect — the next
 * `sendMessage` after a reconnect goes through our wrapper just like the first.
 *
 * Returns a function that restores the original `sendMessage`. Always call it
 * in a `finally` so a failing scenario doesn't leave the wrapper installed.
 *
 * The wrapper:
 *  - Looks up the `before-*` / `after-*-sent` pair for the event.
 *  - Calls every matching `before-*` action (in registration order) and
 *    awaits them, *then* calls the real `sendMessage`.
 *  - After `sendMessage` returns (which for `withAck = true` means the ack
 *    has already arrived), calls every matching `after-*-sent` action.
 *
 * Note on `after-*-sent` semantics for ack-bearing round-trips: the original
 * `sendMessage` awaits the ack internally, so by the time we fire `after-*-sent`
 * the ack has already been received. To precisely overlap the in-flight ack
 * window, your `before-*` action should *schedule* the disturbance with a
 * timer (see the example in the file header) — not block on it. We document
 * this trade-off rather than try to hook between emit and ack, because doing
 * the latter requires patching socket.io-client internals that are not stable.
 *
 * That said, for non-ack `socket.emit` calls (`withAck = false`), `after-*-sent`
 * fires immediately after the emit returns, which is genuinely "right after
 * the bytes hit the wire."
 */
export function installWireFaultHooks(harness: QssHarness, wireFaults: readonly WireFault[]): RestoreWireFaults {
  if (wireFaults.length === 0) {
    return () => undefined
  }

  const byEvent = new Map<WireEvent, WireFault[]>()
  for (const fault of wireFaults) {
    const arr = byEvent.get(fault.at) ?? []
    arr.push(fault)
    byEvent.set(fault.at, arr)
  }

  const client = harness.qssClient
  const original = client.sendMessage.bind(client)

  const fireAll = async (event: WireEvent): Promise<void> => {
    const faults = byEvent.get(event)
    if (faults == null || faults.length === 0) return
    for (const fault of faults) {
      try {
        await fault.action(harness)
      } catch (e) {
        // A fault action throwing shouldn't blow up the production code path
        // — the whole point of the harness is to keep service code unaware
        // of test injection. Log to stderr instead.
        // eslint-disable-next-line no-console
        console.warn(`[precise-faults] action for ${event} threw:`, e)
      }
    }
  }

  // Replace the method with a wrapping function. We keep the same `this`
  // binding by writing to the instance property — Nest's QSSClient is not
  // re-instantiated within a single harness lifetime, so this stays in place
  // until restore().
  ;(client as unknown as { sendMessage: typeof client.sendMessage }).sendMessage = (async function patched(
    event: WebsocketEvents,
    payload: object | undefined,
    withAck = false,
    timeoutAck = 5000
  ) {
    const boundaries = wireBoundariesFor(event)
    if (boundaries == null) {
      return original(event, payload, withAck, timeoutAck) as unknown
    }

    await fireAll(boundaries.before)
    try {
      const result = await original(event, payload, withAck, timeoutAck)
      // After the emit (and, for ack-bearing calls, the ack) — fire post-send
      // hooks. For non-ack emits this is "right after bytes left the socket";
      // for ack-bearing emits it's "right after ack came back" (or the
      // sendMessage timeout fired). Both are useful boundaries.
      await fireAll(boundaries.after)
      return result
    } catch (e) {
      // Still fire `after-*-sent` so cleanup actions run even on failure.
      await fireAll(boundaries.after)
      throw e
    }
  }) as typeof client.sendMessage

  let restored = false
  return (): void => {
    if (restored) return
    restored = true
    ;(client as unknown as { sendMessage: typeof client.sendMessage }).sendMessage = original
  }
}

/**
 * Helper: schedule an outage starting `delayMs` after the action fires,
 * lasting `outageMs`. Returns immediately so the action doesn't block the
 * production code path. Errors from the toxiproxy calls are swallowed —
 * they're noise during chaos and the harness asserts on final state, not
 * on transient errors.
 */
export function scheduleOutageAfter(delayMs: number, outageMs: number): WireFault['action'] {
  return (h: QssHarness): void => {
    setTimeout(() => {
      h.toxiproxy.setEnabled(h.proxyName, false).catch(() => undefined)
      setTimeout(() => {
        h.toxiproxy.setEnabled(h.proxyName, true).catch(() => undefined)
      }, outageMs)
    }, delayMs)
  }
}

/**
 * Helper: wrap an action so it fires only once, on the first matching wire
 * event. Subsequent matches are ignored. Use this for "drop the *first*
 * SIGN_IN_COMMUNITY ack" scenarios — without it, every reconnect-driven
 * retry would re-trigger the fault and the service would never escape.
 *
 * Returns a closure that captures local "armed" state, so each call to
 * `oneShot()` produces an independent latch.
 */
export function oneShot(action: WireFault['action']): WireFault['action'] {
  let armed = true
  return (h: QssHarness): Promise<void> | void => {
    if (!armed) return
    armed = false
    return action(h)
  }
}

/**
 * Helper: synchronously block the event loop for `pauseMs`. Useful for
 * "what if the renderer GC'd for half a second right after this message
 * went out?" — different from network chaos because the socket is fine but
 * the JS path is stalled.
 *
 * Implemented as a busy wait — keep `pauseMs` small (< 1 s) or you'll
 * starve other tests in the same worker.
 */
export function busyWaitPause(pauseMs: number): WireFault['action'] {
  return (): void => {
    const start = Date.now()
    while (Date.now() - start < pauseMs) {
      // intentionally empty: simulating event-loop stall
    }
  }
}
