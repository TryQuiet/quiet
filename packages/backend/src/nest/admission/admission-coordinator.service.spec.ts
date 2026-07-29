import { jest } from '@jest/globals'
import { EventEmitter } from 'events'
import { AdmissionCoordinator } from './admission-coordinator.service'
import {
  AdmissionKind,
  AdmissionRequest,
  AdmissionRuntime,
  AdmissionTransport,
  createDeferredAdmissionCandidate,
  PreparedQssAdmission,
  QssAdmissionStartResult,
} from './admission.types'
import { QSSEvents } from '../qss/qss.types'
import { Libp2pEvents } from '../libp2p/libp2p.types'

describe('AdmissionCoordinator', () => {
  const teamId = 'team'
  const userId = 'user'
  const deviceId = 'device'
  const barrier = { teamId, id: Symbol('barrier') }

  let qssService: EventEmitter & {
    prepareAdmission: jest.Mock<() => Promise<PreparedQssAdmission>>
    startPreparedAdmission: jest.Mock<() => Promise<void>>
  }
  let libp2pService: EventEmitter
  let sigChainService: {
    beginAdmissionPersistenceBarrier: jest.Mock<() => typeof barrier>
    commitAdmissionPersistence: jest.Mock<() => Promise<void>>
    cancelAdmissionPersistence: jest.Mock<() => void>
    getActiveChain: jest.Mock<() => any>
  }
  let localDbService: {
    claimAdmissionTransport: jest.Mock<() => Promise<'claimed' | 'already-owned' | 'conflict'>>
  }
  let runtime: AdmissionRuntime
  let coordinator: AdmissionCoordinator
  let request: AdmissionRequest

  beforeEach(() => {
    qssService = Object.assign(new EventEmitter(), {
      prepareAdmission: jest.fn(async () => ({ teamId, kind: request.kind })),
      startPreparedAdmission: jest.fn(async () => undefined),
    })
    libp2pService = new EventEmitter()
    sigChainService = {
      beginAdmissionPersistenceBarrier: jest.fn(() => barrier),
      commitAdmissionPersistence: jest.fn(async () => undefined),
      cancelAdmissionPersistence: jest.fn(),
      getActiveChain: jest.fn(() => ({
        team: { id: teamId, hasDevice: (candidateDeviceId: string) => candidateDeviceId === deviceId },
        user: { userId },
        device: { deviceId },
        roles: { amIMemberOfRole: () => true },
      })),
    }
    localDbService = {
      claimAdmissionTransport: jest.fn(async () => 'claimed'),
    }
    runtime = {
      startQss: jest.fn(async () => QssAdmissionStartResult.READY),
      pauseQss: jest.fn(),
      startP2p: jest.fn(async () => undefined),
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
    coordinator = new AdmissionCoordinator(
      qssService as any,
      libp2pService as any,
      sigChainService as any,
      localDbService as any
    )
  })

  afterEach(async () => {
    await coordinator.cancelActive(new Error('test cleanup'))
  })

  it('requires every transport candidate to be claimed by an admission session', async () => {
    const deferred = candidate(AdmissionTransport.P2P, AdmissionKind.DEVICE)

    await expect(deferred.waitUntilPersisted()).rejects.toThrow('Admission candidate was not claimed')
  })

  it('admits a device through QSS only after persistence commits', async () => {
    const resultPromise = coordinator.coordinate(request, runtime)
    await flush()
    const deferred = candidate(AdmissionTransport.QSS, AdmissionKind.DEVICE)

    qssService.emit(QSSEvents.ADMISSION_CANDIDATE, deferred.candidate)
    await expect(resultPromise).resolves.toEqual({
      teamId,
      userId,
      deviceId,
      transport: AdmissionTransport.QSS,
    })
    await expect(deferred.waitUntilPersisted()).resolves.toBeUndefined()
    expect(sigChainService.commitAdmissionPersistence).toHaveBeenCalledWith(barrier)
    expect(runtime.startP2p).not.toHaveBeenCalled()
  })

  it('falls back to P2P after terminal QSS device failure and rejects the stale QSS candidate', async () => {
    const resultPromise = coordinator.coordinate(request, runtime)
    await flush()

    qssService.emit(QSSEvents.QSS_AUTH_ERROR, { teamId, error: new Error('terminal QSS failure') })
    await flush()
    expect(runtime.pauseQss).toHaveBeenCalled()
    expect(runtime.startP2p).toHaveBeenCalled()

    const staleQss = candidate(AdmissionTransport.QSS, AdmissionKind.DEVICE)
    qssService.emit(QSSEvents.ADMISSION_CANDIDATE, staleQss.candidate)
    await expect(staleQss.waitUntilPersisted()).rejects.toThrow('losing qss candidate')

    const p2p = candidate(AdmissionTransport.P2P, AdmissionKind.DEVICE)
    libp2pService.emit(Libp2pEvents.ADMISSION_CANDIDATE, p2p.candidate)
    await expect(resultPromise).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
    expect(runtime.convergeQssAfterP2p).toHaveBeenCalled()
  })

  it('falls back before claim when ordinary-member QSS preparation fails', async () => {
    request.kind = AdmissionKind.MEMBER
    qssService.prepareAdmission.mockRejectedValueOnce(new Error('sign-in was not acknowledged'))

    const resultPromise = coordinator.coordinate(request, runtime)
    await flush()
    expect(localDbService.claimAdmissionTransport).toHaveBeenCalledWith(request.communityId, AdmissionTransport.P2P)

    const p2p = candidate(AdmissionTransport.P2P, AdmissionKind.MEMBER)
    libp2pService.emit(Libp2pEvents.ADMISSION_CANDIDATE, p2p.candidate)
    await expect(resultPromise).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
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
    await flush()

    const p2p = candidate(AdmissionTransport.P2P, AdmissionKind.MEMBER)
    libp2pService.emit(Libp2pEvents.ADMISSION_CANDIDATE, p2p.candidate)
    await expect(first).resolves.toMatchObject({ transport: AdmissionTransport.P2P })
    expect(runtime.startQss).not.toHaveBeenCalled()
    expect(localDbService.claimAdmissionTransport).not.toHaveBeenCalled()
  })

  it('fails on a durable transport claim conflict', async () => {
    request.kind = AdmissionKind.MEMBER
    localDbService.claimAdmissionTransport.mockResolvedValueOnce('conflict')

    await expect(coordinator.coordinate(request, runtime)).rejects.toThrow('claim conflict')
    expect(sigChainService.cancelAdmissionPersistence).toHaveBeenCalledWith(barrier)
  })

  it('rejects validation failures and does not commit persistence', async () => {
    const resultPromise = coordinator.coordinate(request, runtime)
    await flush()
    const invalid = candidate(AdmissionTransport.QSS, AdmissionKind.DEVICE, { userId: 'unexpected-user' })

    qssService.emit(QSSEvents.ADMISSION_CANDIDATE, invalid.candidate)
    await expect(resultPromise).rejects.toThrow('Admission user mismatch')
    await expect(invalid.waitUntilPersisted()).rejects.toThrow('Admission user mismatch')
    expect(sigChainService.commitAdmissionPersistence).not.toHaveBeenCalled()
  })

  it('propagates persistence failure to the transport and session', async () => {
    sigChainService.commitAdmissionPersistence.mockRejectedValueOnce(new Error('disk full'))
    const resultPromise = coordinator.coordinate(request, runtime)
    await flush()
    const deferred = candidate(AdmissionTransport.QSS, AdmissionKind.DEVICE)

    qssService.emit(QSSEvents.ADMISSION_CANDIDATE, deferred.candidate)
    await expect(resultPromise).rejects.toThrow('disk full')
    await expect(deferred.waitUntilPersisted()).rejects.toThrow('disk full')
  })

  it('cancels the active session, transports, timeout, and listeners', async () => {
    const resultPromise = coordinator.coordinate(request, runtime)
    await flush()
    await coordinator.cancelActive(new Error('paused'))

    await expect(resultPromise).rejects.toThrow('paused')
    expect(runtime.pauseQss).toHaveBeenCalled()
    expect(qssService.listenerCount(QSSEvents.ADMISSION_CANDIDATE)).toBe(0)
    expect(libp2pService.listenerCount(Libp2pEvents.ADMISSION_CANDIDATE)).toBe(0)
  })

  const candidate = (
    transport: AdmissionTransport,
    kind: AdmissionKind,
    overrides: Partial<{ teamId: string; userId: string; deviceId: string }> = {}
  ) =>
    createDeferredAdmissionCandidate({
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
