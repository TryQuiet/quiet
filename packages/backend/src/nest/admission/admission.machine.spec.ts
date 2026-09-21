import { transition } from './admission.machine'
import {
  AdmissionError,
  AdmissionKind,
  AdmissionRequest,
  AdmissionState,
  AdmissionTransport,
  AttemptState,
  AdmissionCandidate,
} from './admission.types'
const request = { kind: AdmissionKind.DEVICE } as AdmissionRequest
const attempt = {
  attempt: { id: 1, transport: AdmissionTransport.QSS },
  transaction: {},
  claimed: false,
} as AttemptState
const candidate = {} as AdmissionCandidate

it.each(['preparing', 'claiming', 'admitting', 'retiring', 'finalizing'] as const)(
  'ignores retired completions while %s',
  status => {
    const state = { ...attempt, status, candidate } as AdmissionState
    for (const type of ['PREPARED', 'CLAIMED', 'FALLBACK_DUE'] as const) {
      expect(transition(state, { type, attemptId: 0 }, request)).toEqual({ state })
    }
    expect(
      transition(state, { type: 'ATTEMPT_DRAINED', attemptId: 0, nextAttempt: attempt.attempt }, request).effect
    ).toBeUndefined()
    expect(transition(state, { type: 'CANDIDATE', attemptId: 0, candidate }, request).effect).toBeUndefined()
  }
)

it('never changes a selected commit because of cancellation, deadline or transport failure', () => {
  const state: AdmissionState = { ...attempt, status: 'finalizing', candidate }
  const error = new AdmissionError('transport', 'disconnected')
  for (const type of ['CANCEL', 'DEADLINE'] as const)
    expect(transition(state, { type, error }, request).state).toBe(state)
  expect(transition(state, { type: 'ATTEMPT_FAILED', attemptId: 1, error }, request).state).toBe(state)
  expect(transition(state, { type: 'FALLBACK_DUE', attemptId: 1 }, request).state).toBe(state)
})

it('never emits a second result from terminal states', () => {
  for (const status of ['succeeded', 'failed', 'recovery-required'] as const) {
    const state = { status, error: new Error('recovery') } as AdmissionState
    expect(transition(state, { type: 'COMMIT_SUCCEEDED' }, request).effect).toBeUndefined()
    expect(transition(state, { type: 'CANCEL', error: new Error('cancel') }, request).effect).toBeUndefined()
  }
})
