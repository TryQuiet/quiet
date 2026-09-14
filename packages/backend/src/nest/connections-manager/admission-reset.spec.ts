import { jest } from '@jest/globals'
import { ConnectionsManagerService } from './connections-manager.service'
import { ServiceState } from './connections-manager.types'
import { AdmissionError } from '../admission/admission.types'
import { ErrorMessages, SocketActions, SocketEvents } from '@quiet/types'

describe('timed-out invitation recovery', () => {
  const createManager = () => {
    const manager = Object.create(ConnectionsManagerService.prototype) as ConnectionsManagerService
    Object.assign(manager, {
      logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
      communityState: ServiceState.DEFAULT,
      timedOutAdmissionCommunityId: 'pending-community',
      launchGeneration: 1,
      communityLifecycle: { drain: jest.fn<() => Promise<void>>().mockResolvedValue() },
      qssService: { close: jest.fn(), resume: jest.fn<() => Promise<void>>().mockResolvedValue() },
      captchaService: { reset: jest.fn() },
      serverIoProvider: { io: { emit: jest.fn() } },
      erasePreviousCommunityArtifacts: jest.fn<() => Promise<void>>().mockResolvedValue(),
    })
    return manager
  }

  it('does not delete invitation data until admission teardown finishes', async () => {
    const manager = createManager()
    let finish!: () => void
    const drain = jest.fn(
      () =>
        new Promise<void>(resolve => {
          finish = resolve
        })
    )
    manager['communityLifecycle'] = { drain } as any
    const first = manager.resetAdmission('pending-community')
    const duplicate = manager.resetAdmission('pending-community')
    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    finish()
    await expect(first).resolves.toBe(true)
    await expect(duplicate).resolves.toBe(true)
    expect(drain).toHaveBeenCalledTimes(1)
    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
    expect(manager['timedOutAdmissionCommunityId']).toBeUndefined()
    await expect(manager.resetAdmission('pending-community')).resolves.toBe(true)
    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
  })

  it('retains the recovery target when teardown fails so cleanup can be retried', async () => {
    const manager = createManager()
    jest.mocked(manager['communityLifecycle']!.drain).mockRejectedValueOnce(new Error('cleanup failed'))
    await expect(manager.resetAdmission('pending-community')).rejects.toThrow('cleanup failed')
    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    await expect(manager.resetAdmission('pending-community')).resolves.toBe(true)
  })

  it.each(['', 'another-community'])('rejects cleanup for an unrelated target: %s', async id => {
    const manager = createManager()
    await expect(manager.resetAdmission(id)).resolves.toBe(false)
    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
  })

  it('rejects cleanup once a launch is active', async () => {
    const manager = createManager()
    manager['communityState'] = ServiceState.LAUNCHED
    await expect(manager.resetAdmission('pending-community')).resolves.toBe(false)
    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
  })

  it.each([true, false])('reports a distinct error only for an admission timeout: %s', async timeout => {
    const manager = createManager()
    const emit = jest.fn()
    Object.assign(manager, {
      localDbService: {
        getCommunity: jest.fn<() => Promise<any>>().mockResolvedValue({ id: 'pending-community' }),
        setCurrentCommunityId: jest.fn<() => Promise<void>>().mockResolvedValue(),
      },
      serverIoProvider: { io: { emit } },
      launch: jest
        .fn<() => Promise<void>>()
        .mockRejectedValue(timeout ? new AdmissionError('timeout', 'expired') : new Error('failed')),
    })
    await manager.launchCommunity('pending-community')
    expect(emit).toHaveBeenCalledWith(
      SocketEvents.ERROR,
      expect.objectContaining({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'pending-community',
        message: timeout ? ErrorMessages.ADMISSION_TIMEOUT : ErrorMessages.COMMUNITY_LAUNCH_FAILED,
      })
    )
    expect(manager['timedOutAdmissionCommunityId']).toBe(timeout ? 'pending-community' : undefined)
  })

  it('reports an explicitly rejected invitation as invalid', async () => {
    const manager = createManager()
    const emit = jest.fn()
    Object.assign(manager, {
      localDbService: {
        getCommunity: jest.fn<() => Promise<any>>().mockResolvedValue({ id: 'pending-community' }),
        setCurrentCommunityId: jest.fn<() => Promise<void>>().mockResolvedValue(),
      },
      serverIoProvider: { io: { emit } },
      launch: jest
        .fn<() => Promise<void>>()
        .mockRejectedValue(new AdmissionError('protocol', 'INVITATION_PROOF_INVALID')),
    })

    await manager.launchCommunity('pending-community')

    expect(emit).toHaveBeenCalledWith(
      SocketEvents.ERROR,
      expect.objectContaining({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'pending-community',
        message: ErrorMessages.INVALID_INVITE,
      })
    )
    expect(manager['timedOutAdmissionCommunityId']).toBeUndefined()
  })

  it('reports lifecycle cancellation as an interrupted admission that can be reset', async () => {
    const manager = createManager()
    manager['timedOutAdmissionCommunityId'] = undefined
    const emit = jest.fn()
    Object.assign(manager, {
      localDbService: {
        getCommunity: jest.fn<() => Promise<any>>().mockResolvedValue({ id: 'pending-community' }),
        setCurrentCommunityId: jest.fn<() => Promise<void>>().mockResolvedValue(),
      },
      serverIoProvider: { io: { emit } },
      launch: jest
        .fn<() => Promise<void>>()
        .mockRejectedValue(new AdmissionError('cancelled', 'application hibernated')),
    })

    await manager.launchCommunity('pending-community')

    expect(emit).toHaveBeenCalledWith(
      SocketEvents.ERROR,
      expect.objectContaining({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'pending-community',
        message: ErrorMessages.ADMISSION_INTERRUPTED,
      })
    )
    expect(manager['interruptedAdmissionCommunityId']).toBe('pending-community')
    await expect(manager.resetAdmission('pending-community')).resolves.toBe(true)
  })

  it('purges a provisional admission instead of resuming it after a process restart', async () => {
    const manager = createManager()
    manager['timedOutAdmissionCommunityId'] = undefined
    const interruptedCommunity = { id: 'pending-community', name: 'Quiet', teamId: 'team' }
    Object.assign(manager, {
      localDbService: { getCurrentCommunity: jest.fn(async () => interruptedCommunity) },
      sigChainService: {
        loadChain: jest.fn(async () => undefined),
        getActiveChain: jest.fn(() => ({
          team: {},
          roles: { amIMemberOfRole: jest.fn(() => false) },
        })),
      },
    })
    const launch = jest.spyOn(manager, 'launchCommunity').mockResolvedValue()

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
    expect(launch).not.toHaveBeenCalled()
    expect(manager['interruptedAdmissionCommunityId']).toBe('pending-community')
    expect(manager['clearedAdmissionCommunityId']).toBe('pending-community')
  })

  it('reports a startup interruption after the frontend handshake', () => {
    const manager = createManager()
    manager['timedOutAdmissionCommunityId'] = undefined
    manager['interruptedAdmissionCommunityId'] = 'pending-community'
    const emit = jest.fn()
    Object.assign(manager, {
      serverIoProvider: { io: { emit } },
      socketService: {
        on: jest.fn((event: string, listener: (...args: any[]) => void) => {
          if (event === SocketActions.START) listener()
        }),
      },
    })

    manager['attachSocketServiceListeners']()

    expect(emit).toHaveBeenCalledWith(
      SocketEvents.ERROR,
      expect.objectContaining({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'pending-community',
        message: ErrorMessages.ADMISSION_INTERRUPTED,
      })
    )
  })
})
