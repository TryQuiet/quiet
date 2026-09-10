import { transition } from './admission.machine'
import { AdmissionError, AdmissionKind, AdmissionRequest, AdmissionState, AdmissionTransport } from './admission.types'
const request = { kind: AdmissionKind.DEVICE } as AdmissionRequest
const attempt = { attemptId: 1, transport: AdmissionTransport.QSS, claimed: false }

it.each(['preparing', 'claiming', 'admitting', 'retiring', 'finalizing'] as const)(
  'ignores retired completions while %s',
  status => {
    const state = { ...attempt, status, token: Symbol() } as AdmissionState
    for (const type of ['PREPARED', 'CLAIMED', 'ATTEMPT_DRAINED', 'FALLBACK_DUE'] as const) {
      expect(transition(state, { type, attemptId: 0 }, request)).toEqual({ state, effects: [] })
    }
    expect(transition(state, { type: 'CANDIDATE', attemptId: 0, token: Symbol() }, request).effects).toEqual([])
  }
)

it('never changes a selected commit because of cancellation, deadline or transport failure', () => {
  const state: AdmissionState = { ...attempt, status: 'finalizing', token: Symbol() }
  const error = new AdmissionError('transport', 'disconnected')
  for (const type of ['CANCEL', 'DEADLINE'] as const)
    expect(transition(state, { type, error }, request).state).toBe(state)
  expect(transition(state, { type: 'ATTEMPT_FAILED', attemptId: 1, error }, request).state).toBe(state)
  expect(transition(state, { type: 'FALLBACK_DUE', attemptId: 1 }, request).state).toBe(state)
})

it('never emits a second result from terminal states', () => {
  for (const status of ['succeeded', 'failed', 'recovery-required'] as const) {
    const state = { status, error: new Error('recovery') } as AdmissionState
    expect(transition(state, { type: 'COMMIT_SUCCEEDED' }, request).effects).toEqual([])
    expect(transition(state, { type: 'CANCEL', error: new Error('cancel') }, request).effects).toEqual([])
  }
})
