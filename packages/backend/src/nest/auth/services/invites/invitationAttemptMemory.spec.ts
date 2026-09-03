import { jest } from '@jest/globals'

import {
  ATTEMPT_LIFETIME_MS,
  InvitationAttemptMemory,
  MAX_REMEMBERED_ATTEMPTS,
  type PriorInvitationProof,
} from './invitationAttemptMemory'

/**
 * Audit finding M-1. The invitee's acceptance rule cannot be relaxed globally,
 * so a retry is only allowed to succeed against a proof this device actually
 * presented, to the peer it presented it to, and only for a short while. These
 * cover the narrowness of that memory rather than its use.
 */
describe('InvitationAttemptMemory', () => {
  const attempt = (presentedTo: string, id = 'invite-1'): PriorInvitationProof =>
    ({ proof: { id, publicKey: `key-${presentedTo}` }, presentedTo }) as unknown as PriorInvitationProof

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('remembers an attempt and hands it back', () => {
    const memory = new InvitationAttemptMemory()
    memory.remember(attempt('device-a'))

    expect(memory.list()).toEqual([attempt('device-a')])
  })

  it('supersedes rather than accumulates for a repeated peer', () => {
    const memory = new InvitationAttemptMemory()
    memory.remember(attempt('device-a', 'invite-1'))
    memory.remember(attempt('device-a', 'invite-2'))

    const remembered = memory.list()
    expect(remembered).toHaveLength(1)
    expect(remembered[0].proof).toEqual(attempt('device-a', 'invite-2').proof)
  })

  it('keeps at most the cap, dropping the oldest', () => {
    const memory = new InvitationAttemptMemory()
    for (let i = 0; i < MAX_REMEMBERED_ATTEMPTS + 3; i++) {
      memory.remember(attempt(`device-${i}`))
    }

    const remembered = memory.list()
    expect(remembered).toHaveLength(MAX_REMEMBERED_ATTEMPTS)
    // The three oldest fell off the front.
    expect(remembered.map(a => a.presentedTo)).toEqual(['device-3', 'device-4', 'device-5', 'device-6', 'device-7'])
  })

  it('expires an attempt once its lifetime has passed', () => {
    const start = Date.now()
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(start)

    const memory = new InvitationAttemptMemory()
    memory.remember(attempt('device-a'))
    expect(memory.size).toBe(1)

    now.mockReturnValue(start + ATTEMPT_LIFETIME_MS - 1_000)
    expect(memory.size).toBe(1)

    now.mockReturnValue(start + ATTEMPT_LIFETIME_MS + 1)
    expect(memory.size).toBe(0)
    expect(memory.list()).toEqual([])
  })

  it('expires only the entries that are actually stale', () => {
    const start = Date.now()
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(start)

    const memory = new InvitationAttemptMemory()
    memory.remember(attempt('device-old'))

    now.mockReturnValue(start + ATTEMPT_LIFETIME_MS - 1_000)
    memory.remember(attempt('device-new'))

    now.mockReturnValue(start + ATTEMPT_LIFETIME_MS + 1)
    expect(memory.list().map(a => a.presentedTo)).toEqual(['device-new'])
  })

  it('forgets everything on a successful join', () => {
    const memory = new InvitationAttemptMemory()
    memory.remember(attempt('device-a'))
    memory.remember(attempt('device-b'))

    memory.clear()

    expect(memory.size).toBe(0)
    expect(memory.list()).toEqual([])
  })

  it('honours a shorter configured lifetime and cap', () => {
    const start = Date.now()
    const now = jest.spyOn(Date, 'now')
    now.mockReturnValue(start)

    const memory = new InvitationAttemptMemory(2, 1_000)
    memory.remember(attempt('device-a'))
    memory.remember(attempt('device-b'))
    memory.remember(attempt('device-c'))
    expect(memory.list().map(a => a.presentedTo)).toEqual(['device-b', 'device-c'])

    now.mockReturnValue(start + 1_001)
    expect(memory.size).toBe(0)
  })
})
