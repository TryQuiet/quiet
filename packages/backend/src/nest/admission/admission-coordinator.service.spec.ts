import { jest } from '@jest/globals'
import { AdmissionCoordinator } from './admission-coordinator.service'
import {
  AdmissionCandidate,
  AdmissionFinalizer,
  AdmissionKind,
  AdmissionRequest,
  AdmissionRuntime,
  AdmissionTransport,
  PreparedQssAdmission,
  QssAdmissionStartResult,
} from './admission.types'

describe('AdmissionCoordinator', () => {
  const teamId = 'team'
  const userId = 'user'
  const deviceId = 'device'

  let qssService: {
    prepareAdmission: jest.Mock<() => Promise<PreparedQssAdmission>>
    startPreparedAdmission: jest.Mock<(prepared: PreparedQssAdmission, finalize: AdmissionFinalizer) => Promise<any>>
  }
  let commit: jest.Mock<() => Promise<void>>
  let sigChainService: {
    withAdmissionPersistence: jest.Mock<
      <T>(team: string, operation: (scope: { commit(): Promise<void> }) => Promise<T>) => Promise<T>
    >
    getActiveChain: jest.Mock<() => any>
  }
  let localDbService: {
    claimAdmissionTransport: jest.Mock<() => Promise<'claimed' | 'already-owned' | 'conflict'>>
  }
  let runtime: AdmissionRuntime
  let coordinator: AdmissionCoordinator
  let request: AdmissionRequest

  beforeEach(() => {
    commit = jest.fn(async () => undefined)
    sigChainService = {
      withAdmissionPersistence: jest.fn(async (_team, operation) => operation({ commit })),
      getActiveChain: jest.fn(() => ({
        team: { id: teamId, hasDevice: (candidateDeviceId: string) => candidateDeviceId === deviceId },
        user: { userId },
        device: { deviceId },
        roles: { amIMemberOfRole: () => true },
      })),
    }
    qssService = {
      prepareAdmission: jest.fn(async () => ({ teamId, kind: request.kind })),
      startPreparedAdmission: jest.fn(async (_prepared, finalize) =>
        finalize(candidate(AdmissionTransport.QSS, request.kind))
      ),
    }
    localDbService = {
      claimAdmissionTransport: jest.fn(async () => 'claimed'),
    }
    runtime = {
      startQss: jest.fn(async () => QssAdmissionStartResult.READY),
      pauseQss: jest.fn(),
      startP2p: jest.fn(async (finalize: AdmissionFinalizer) =>
        finalize(candidate(AdmissionTransport.P2P, request.kind))
      ),
      stopP2p: jest.fn(async () => undefined),
      convergeQssAfterP2p: jest.fn(async () => undefined),
    }
    request = {
      communityId: 'community',
      teamId,
      expectedUserId: userId,
      expectedDeviceId: deviceId,
      kind: AdmissionKind.DEVICE,
      preferredTransport: AdmissionTransport.QSS,
      timeoutMs: 10_000,
    }
    coordinator = new AdmissionCoordinator(qssService as any, sigChainService as any, localDbService as any)
  })

  afterEach(async () => {
    await coordinator.cancelActive(new Error('test cleanup'))
  })

  it('admits a device through QSS only after persistence commits', async () => {
    await expect(coordinator.coordinate(request, runtime)).resolves.toEqual({
      teamId,
      userId,
      deviceId,
      transport: AdmissionTransport.QSS,
    })
    expect(commit).toHaveBeenCalledTimes(1)
    expect(runtime.startP2p).not.toHaveBeenCalled()
  })

  it('falls back to P2P after terminal QSS device failure', async () => {
    qssService.startPreparedAdmission.mockRejectedValueOnce(new Error('terminal QSS failure'))

    await expect(coordinator.coordinate(request, runtime)).resolves.toMatchObject({
      transport: AdmissionTransport.P2P,
    })

    expect(runtime.pauseQss).toHaveBeenCalled()
    expect(runtime.startP2p).toHaveBeenCalled()
    expect(runtime.convergeQssAfterP2p).toHaveBeenCalled()
  })

  it('falls back before claim when ordinary-member QSS preparation fails', async () => {
    request.kind = AdmissionKind.MEMBER
    qssService.prepareAdmission.mockRejectedValueOnce(new Error('sign-in was not acknowledged'))

    await expect(coordinator.coordinate(request, runtime)).resolves.toMatchObject({
      transport: AdmissionTransport.P2P,
    })
    expect(localDbService.claimAdmissionTransport).toHaveBeenCalledWith(request.communityId, AdmissionTransport.P2P)
  })

  it('refuses ordinary-member fallback after QSS ownership is claimed', async () => {
    request.kind = AdmissionKind.MEMBER
    qssService.startPreparedAdmission.mockRejectedValueOnce(new Error('LFA start failed'))

    await expect(coordinator.coordinate(request, runtime)).rejects.toThrow('LFA start failed')
    expect(localDbService.claimAdmissionTransport).toHaveBeenCalledWith(request.communityId, AdmissionTransport.QSS)
    expect(runtime.startP2p).not.toHaveBeenCalled()
  })

  it('honors stored P2P ownership without starting QSS or claiming again', async () => {
    request.kind = AdmissionKind.MEMBER
    request.storedTransport = AdmissionTransport.P2P

    const first = coordinator.coordinate(request, runtime)
    const repeated = coordinator.coordinate(request, runtime)

    expect(repeated).toBe(first)
    await expect(first).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
    expect(runtime.startQss).not.toHaveBeenCalled()
    expect(localDbService.claimAdmissionTransport).not.toHaveBeenCalled()
  })

  it('fails on a durable transport claim conflict', async () => {
    request.kind = AdmissionKind.MEMBER
    localDbService.claimAdmissionTransport.mockResolvedValueOnce('conflict')

    await expect(coordinator.coordinate(request, runtime)).rejects.toThrow('claim conflict')
    expect(commit).not.toHaveBeenCalled()
  })

  it('rejects validation failures and does not commit persistence', async () => {
    qssService.startPreparedAdmission.mockImplementationOnce(async (_prepared, finalize) =>
      finalize(candidate(AdmissionTransport.QSS, AdmissionKind.DEVICE, { userId: 'unexpected-user' }))
    )

    await expect(coordinator.coordinate(request, runtime)).rejects.toThrow('Admission user mismatch')
    expect(commit).not.toHaveBeenCalled()
  })

  it('propagates persistence failure through the transport promise', async () => {
    commit.mockRejectedValueOnce(new Error('disk full'))

    await expect(coordinator.coordinate(request, runtime)).rejects.toThrow('disk full')
  })

  it('finalizes only the first candidate when a transport completes concurrently', async () => {
    let resolveCommit!: () => void
    commit.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveCommit = resolve
        })
    )
    jest.mocked(runtime.startP2p).mockImplementationOnce(async (finalize: AdmissionFinalizer) => {
      const first = finalize(candidate(AdmissionTransport.P2P, request.kind))
      const second = finalize(candidate(AdmissionTransport.P2P, request.kind))
      expect(second).toBe(first)
      resolveCommit()
      return first
    })
    request.preferredTransport = AdmissionTransport.P2P

    await expect(coordinator.coordinate(request, runtime)).resolves.toMatchObject({
      transport: AdmissionTransport.P2P,
    })
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('cancels the active transport and rejects the operation', async () => {
    let rejectAdmission!: (error: Error) => void
    qssService.startPreparedAdmission.mockImplementationOnce(
      async () =>
        new Promise((_resolve, reject) => {
          rejectAdmission = reject
        })
    )
    runtime.pauseQss = jest.fn(() => rejectAdmission(new Error('paused')))

    const result = coordinator.coordinate(request, runtime)
    await flush()
    await coordinator.cancelActive(new Error('paused'))

    await expect(result).rejects.toThrow('paused')
    expect(runtime.pauseQss).toHaveBeenCalled()
  })

  const candidate = (
    transport: AdmissionTransport,
    kind: AdmissionKind,
    overrides: Partial<{ teamId: string; userId: string; deviceId: string }> = {}
  ): AdmissionCandidate => ({
    transport,
    kind,
    teamId: overrides.teamId ?? teamId,
    userId: overrides.userId ?? userId,
    deviceId: overrides.deviceId ?? deviceId,
  })

  const flush = async (): Promise<void> => {
    await new Promise<void>(resolve => setImmediate(resolve))
  }
})
