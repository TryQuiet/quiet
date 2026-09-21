import {
  AdmissionEvent,
  AdmissionKind,
  AdmissionRequest,
  AdmissionState,
  AdmissionTransition,
  AdmissionTransport,
} from './admission.types'

/** Policy only: state is installed before the coordinator executes these effects. */
export function transition(
  state: AdmissionState,
  event: AdmissionEvent,
  request: AdmissionRequest
): AdmissionTransition {
  const unchanged: AdmissionTransition = { state }
  if (state.status === 'succeeded' || state.status === 'failed' || state.status === 'recovery-required')
    return unchanged
  if ('attemptId' in event && (!('attempt' in state) || event.attemptId !== state.attempt?.id)) return unchanged
  const attempt = 'attempt' in state ? state.attempt : undefined

  switch (event.type) {
    case 'LOADED':
      return state.status === 'loading'
        ? {
            state: {
              status: 'preparing',
              transaction: event.transaction,
              attempt: event.attempt,
              claimed: event.claimed,
            },
            effect: 'prepare',
          }
        : unchanged
    case 'PREPARED':
      if (state.status !== 'preparing') return unchanged
      return request.kind === AdmissionKind.MEMBER && !state.claimed
        ? { state: { ...state, status: 'claiming' }, effect: 'claim' }
        : { state: { ...state, status: 'admitting' }, effect: 'start' }
    case 'CLAIMED':
      return state.status === 'claiming'
        ? { state: { ...state, status: 'admitting', claimed: true }, effect: 'start' }
        : unchanged
    case 'CANDIDATE':
      return state.status === 'admitting'
        ? { state: { ...state, status: 'finalizing', candidate: event.candidate }, effect: 'finalize' }
        : unchanged
    case 'FALLBACK_DUE':
    case 'ATTEMPT_FAILED': {
      if (state.status !== 'preparing' && state.status !== 'admitting') return unchanged
      const fallback =
        state.attempt.transport === AdmissionTransport.QSS &&
        !state.claimed &&
        (request.kind === AdmissionKind.DEVICE
          ? event.type === 'FALLBACK_DUE' ||
            (event.type === 'ATTEMPT_FAILED' && ['availability', 'transport'].includes(event.error.kind))
          : state.status === 'preparing' && event.type === 'ATTEMPT_FAILED' && event.error.kind === 'availability')
      if (fallback) return { state: { ...state, status: 'retiring' }, effect: 'retire' }
      return event.type === 'ATTEMPT_FAILED'
        ? { state: { status: 'draining', attempt, error: event.error }, effect: 'drain' }
        : unchanged
    }
    case 'ATTEMPT_DRAINED':
      return state.status === 'retiring'
        ? {
            state: {
              status: 'preparing',
              transaction: state.transaction,
              attempt: event.nextAttempt,
              claimed: false,
            },
            effect: 'prepare',
          }
        : unchanged
    case 'CANCEL':
    case 'DEADLINE':
      if (state.status === 'finalizing' || state.status === 'draining') return unchanged
      return { state: { status: 'draining', attempt, error: event.error }, effect: 'drain' }
    case 'FAILED':
      return state.status === 'draining'
        ? unchanged
        : { state: { status: 'draining', attempt, error: event.error }, effect: 'drain' }
    case 'RECOVERY_REQUIRED':
      return { state: { status: 'recovery-required', attempt, error: event.error }, effect: 'recover' }
    case 'COMMIT_SUCCEEDED':
      return state.status === 'finalizing'
        ? { state: { status: 'succeeded', candidate: state.candidate, attempt: state.attempt }, effect: 'succeed' }
        : unchanged
    case 'DRAINED':
      return state.status === 'draining' ? { state: { status: 'failed' }, effect: 'release' } : unchanged
    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}
