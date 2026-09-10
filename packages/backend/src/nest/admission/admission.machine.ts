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
  const unchanged: AdmissionTransition = { state, effects: [] }
  if (state.status === 'succeeded' || state.status === 'failed' || state.status === 'recovery-required')
    return unchanged
  if ('attemptId' in event && (!('attemptId' in state) || event.attemptId !== state.attemptId)) return unchanged

  switch (event.type) {
    case 'LOADED':
      return state.status === 'loading'
        ? {
            state: { status: 'preparing', attemptId: 1, transport: event.transport, claimed: event.claimed },
            effects: ['prepare'],
          }
        : unchanged
    case 'PREPARED':
      if (state.status !== 'preparing') return unchanged
      return request.kind === AdmissionKind.MEMBER && !state.claimed
        ? { state: { ...state, status: 'claiming' }, effects: ['claim'] }
        : { state: { ...state, status: 'admitting' }, effects: ['start'] }
    case 'CLAIMED':
      return state.status === 'claiming'
        ? { state: { ...state, status: 'admitting', claimed: true }, effects: ['start'] }
        : unchanged
    case 'CANDIDATE':
      return state.status === 'admitting'
        ? { state: { ...state, status: 'finalizing', token: event.token }, effects: ['finalize'] }
        : unchanged
    case 'FALLBACK_DUE':
    case 'ATTEMPT_FAILED': {
      if (state.status !== 'preparing' && state.status !== 'admitting') return unchanged
      const fallback =
        state.transport === AdmissionTransport.QSS &&
        !state.claimed &&
        (request.kind === AdmissionKind.DEVICE
          ? event.type === 'FALLBACK_DUE' ||
            (event.type === 'ATTEMPT_FAILED' && ['availability', 'transport'].includes(event.error.kind))
          : state.status === 'preparing' && event.type === 'ATTEMPT_FAILED' && event.error.kind === 'availability')
      if (fallback) return { state: { ...state, status: 'retiring' }, effects: ['retire'] }
      return event.type === 'ATTEMPT_FAILED'
        ? { state: { status: 'draining', error: event.error }, effects: ['drain'] }
        : unchanged
    }
    case 'ATTEMPT_DRAINED':
      return state.status === 'retiring'
        ? {
            state: {
              status: 'preparing',
              attemptId: state.attemptId + 1,
              transport: AdmissionTransport.P2P,
              claimed: false,
            },
            effects: ['prepare'],
          }
        : unchanged
    case 'CANCEL':
    case 'DEADLINE':
      if (state.status === 'finalizing' || state.status === 'draining') return unchanged
      return { state: { status: 'draining', error: event.error }, effects: ['drain'] }
    case 'FAILED':
      return state.status === 'draining'
        ? unchanged
        : { state: { status: 'draining', error: event.error }, effects: ['drain'] }
    case 'RECOVERY_REQUIRED':
      return { state: { status: 'recovery-required', error: event.error }, effects: ['recover'] }
    case 'COMMIT_SUCCEEDED':
      return state.status === 'finalizing' ? { state: { status: 'succeeded' }, effects: ['succeed'] } : unchanged
    case 'DRAINED':
      return state.status === 'draining' ? { state: { status: 'failed' }, effects: ['release'] } : unchanged
    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}
