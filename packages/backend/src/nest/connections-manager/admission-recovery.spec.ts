import { expect, jest } from '@jest/globals'
import { ErrorMessages, SocketActions } from '@quiet/types'

import { ConnectionsManagerService } from './connections-manager.service'
import { AdmissionError, ServiceState } from './connections-manager.types'

describe('invitation admission recovery', () => {
  const createManager = () => {
    const manager = Object.create(ConnectionsManagerService.prototype) as ConnectionsManagerService
    Object.assign(manager, {
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      communityState: ServiceState.DEFAULT,
      admissionGeneration: 1,
      timedOutAdmissionCommunityId: 'pending-community',
      serverIoProvider: { io: { emit: jest.fn() } },
      qssService: { close: jest.fn(), resume: jest.fn(async () => undefined) },
      captchaService: { reset: jest.fn() },
      erasePreviousCommunityArtifacts: jest.fn(async () => undefined),
      clearAdmissionInProgressMarker: jest.fn(),
    })
    return manager
  }

  it('invalidates before transport shutdown and shares concurrent reset work', async () => {
    const manager = createManager()
    let finishTransportShutdown!: () => void
    const closeAdmissionTransports = jest.fn(
      () =>
        new Promise<void>(resolve => {
          finishTransportShutdown = resolve
        })
    )
    const attempt = {
      communityId: 'pending-community',
      invitationType: 'device' as const,
      deadline: Date.now() + 60_000,
      generation: 1,
      timer: setTimeout(() => undefined, 60_000),
      invalidated: false,
    }
    Object.assign(manager, {
      pendingAdmissionAttempt: attempt,
      closeAdmissionTransports,
    })

    const first = manager.resetAdmission('pending-community')
    const duplicate = manager.resetAdmission('pending-community')

    expect(attempt.invalidated).toBe(true)
    expect(manager['admissionGeneration']).toBe(2)
    expect(closeAdmissionTransports).toHaveBeenCalledTimes(1)
    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()

    finishTransportShutdown()
    await expect(first).resolves.toBe(true)
    await expect(duplicate).resolves.toBe(true)
    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)

    await expect(manager.resetAdmission('pending-community')).resolves.toBe(true)
    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
  })

  it('does not reject launch until timed-out admission transports have closed', async () => {
    const manager = createManager()
    let finishTransportShutdown!: () => void
    const rejection = jest.fn()
    const attempt = {
      communityId: 'pending-community',
      invitationType: 'device' as const,
      deadline: Date.now() + 60_000,
      generation: 1,
      timer: setTimeout(() => undefined, 60_000),
      invalidated: false,
      reject: rejection,
    }
    Object.assign(manager, {
      pendingAdmissionAttempt: attempt,
      closeAdmissionTransports: jest.fn(
        () =>
          new Promise<void>(resolve => {
            finishTransportShutdown = resolve
          })
      ),
    })

    const timeout = manager['timeoutPendingAdmission'](attempt)

    expect(attempt.invalidated).toBe(true)
    expect(rejection).not.toHaveBeenCalled()
    finishTransportShutdown()
    await timeout

    expect(rejection).toHaveBeenCalledWith(expect.any(AdmissionError))
    expect(rejection.mock.calls[0][0]).toMatchObject({ kind: 'timeout' })
  })

  it('starts one durable deadline for member admission before launch', () => {
    jest.useFakeTimers()
    const manager = createManager()
    const writeAdmissionInProgressMarker = jest.fn()
    Object.assign(manager, { writeAdmissionInProgressMarker })

    const attempt = manager['ensurePendingAdmissionAttempt']('member-community', 'community')
    const duplicate = manager['ensurePendingAdmissionAttempt']('member-community', 'community')

    expect(duplicate).toBe(attempt)
    expect(attempt.invitationType).toBe('community')
    expect(writeAdmissionInProgressMarker).toHaveBeenCalledWith({
      communityId: 'member-community',
      invitationType: 'community',
    })
    expect(writeAdmissionInProgressMarker).toHaveBeenCalledTimes(1)

    clearTimeout(attempt.timer)
    jest.useRealTimers()
  })

  it('emits a terminal timeout when the deadline expires before launch registers a rejector', async () => {
    const manager = createManager()
    manager['communityState'] = ServiceState.LAUNCHING
    const attempt = {
      communityId: 'member-community',
      invitationType: 'community' as const,
      deadline: Date.now() + 60_000,
      generation: 1,
      timer: setTimeout(() => undefined, 60_000),
      invalidated: false,
    }
    Object.assign(manager, {
      pendingAdmissionAttempt: attempt,
      closeAdmissionTransports: jest.fn(async () => undefined),
    })

    await manager['timeoutPendingAdmission'](attempt)

    expect(attempt).toMatchObject({ readyToReject: true, errorEmitted: true })
    expect(manager['serverIoProvider'].io.emit).toHaveBeenCalledWith(SocketActions.ERROR, {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_TIMEOUT,
      community: 'member-community',
    })
    await expect(manager.resetAdmission('member-community')).resolves.toBe(true)
  })

  it('does not create transports when identity lookup completes after the deadline', async () => {
    const manager = createManager()
    let resolveIdentity!: (identity: unknown) => void
    const getIdentity = jest.fn(
      () =>
        new Promise(resolve => {
          resolveIdentity = resolve
        })
    )
    const createInstance = jest.fn()
    const attempt = {
      communityId: 'member-community',
      invitationType: 'community' as const,
      deadline: Date.now() + 60_000,
      generation: 1,
      timer: setTimeout(() => undefined, 60_000),
      invalidated: false,
    }
    Object.assign(manager, {
      pendingAdmissionAttempt: attempt,
      admissionGeneration: 1,
      sigChainService: { getActiveChain: jest.fn(() => ({ isPendingDeviceAdmission: false, team: undefined })) },
      storageService: { getIdentity },
      libp2pService: { createInstance },
      closeAdmissionTransports: jest.fn(async () => undefined),
    })

    const launch = manager.launch({ id: 'member-community' } as Parameters<ConnectionsManagerService['launch']>[0])
    await Promise.resolve()
    await manager['timeoutPendingAdmission'](attempt)
    resolveIdentity({})

    await expect(launch).rejects.toMatchObject({ kind: 'timeout' })
    expect(createInstance).not.toHaveBeenCalled()
  })

  it('rejects a persisted admission restored after restart before opening transports', async () => {
    const manager = createManager()
    Object.assign(manager, {
      restoredAdmissionMarker: { communityId: 'pending-community', invitationType: 'community' },
      sigChainService: { getActiveChain: jest.fn(() => ({ isPendingDeviceAdmission: false, team: undefined })) },
      storageService: { getIdentity: jest.fn() },
    })

    await expect(
      manager.launch({ id: 'pending-community' } as Parameters<ConnectionsManagerService['launch']>[0])
    ).rejects.toMatchObject({ kind: 'cancelled' })
    expect(manager['storageService'].getIdentity).not.toHaveBeenCalled()
  })

  it('reports a pending member chain as interrupted on startup and preserves it until reset', async () => {
    const manager = createManager()
    const community = { id: 'pending-community', name: 'Pending', teamId: 'pending-team' }
    const deleteCommunity = jest.fn()
    const deleteChain = jest.fn()
    Object.assign(manager, {
      leaveInProgressMarkerExists: jest.fn(() => false),
      readAdmissionInProgressMarker: jest.fn(() => ({
        communityId: community.id,
        invitationType: 'community',
      })),
      localDbService: {
        getCurrentCommunity: jest.fn(async () => community),
        deleteCommunity,
      },
      sigChainService: {
        loadChain: jest.fn(async () => {
          throw new Error('missing serialized team')
        }),
        deleteChain,
      },
    })

    await manager.launchCommunityFromStorage()

    expect(manager['serverIoProvider'].io.emit).toHaveBeenCalledWith(SocketActions.ERROR, {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_INTERRUPTED,
      community: community.id,
      trace: expect.any(String),
    })
    expect(deleteCommunity).not.toHaveBeenCalled()
    expect(deleteChain).not.toHaveBeenCalled()
    await expect(manager.resetAdmission(community.id)).resolves.toBe(true)
  })

  it('ignores a leftover restart marker after admission became durable', async () => {
    const manager = createManager()
    const clearAdmissionInProgressMarker = jest.fn()
    Object.assign(manager, {
      restoredAdmissionMarker: { communityId: 'pending-community', invitationType: 'community' },
      clearAdmissionInProgressMarker,
      sigChainService: {
        getActiveChain: jest.fn(() => ({
          isPendingDeviceAdmission: false,
          team: { id: 'team' },
          roles: { amIMemberOfRole: jest.fn(() => true) },
        })),
      },
      storageService: { getIdentity: jest.fn(async () => undefined) },
    })

    await expect(
      manager.launch({ id: 'pending-community' } as Parameters<ConnectionsManagerService['launch']>[0])
    ).rejects.not.toMatchObject({ kind: 'cancelled' })
    expect(clearAdmissionInProgressMarker).toHaveBeenCalledTimes(1)
  })
})
