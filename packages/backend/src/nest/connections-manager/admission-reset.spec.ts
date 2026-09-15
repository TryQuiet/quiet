import { jest } from '@jest/globals'
import { ConnectionsManagerService } from './connections-manager.service'
import { ServiceState } from './connections-manager.types'
import { AdmissionError } from '../admission/admission.types'
import { ErrorMessages, SocketActions, SocketEvents } from '@quiet/types'
import { Mutex } from 'async-mutex'
import fs from 'fs'
import os from 'os'
import path from 'path'

describe('timed-out invitation recovery', () => {
  let receiptRoot: string

  beforeEach(() => {
    receiptRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-admission-reset-'))
  })

  afterEach(() => {
    fs.rmSync(receiptRoot, { recursive: true, force: true })
  })

  const createManager = (quietDir = path.join(receiptRoot, 'backend')) => {
    const manager = Object.create(ConnectionsManagerService.prototype) as ConnectionsManagerService
    let storedCommunity: any = { id: 'pending-community', teamId: 'team', inviteData: {} }
    const localDbService = {
      getCommunity: jest.fn(async (id: string) => (storedCommunity?.id === id ? storedCommunity : undefined)),
      getCurrentCommunity: jest.fn(async () => storedCommunity),
      getCommunities: jest.fn(async () => (storedCommunity == null ? {} : { [storedCommunity.id]: storedCommunity })),
    }
    const erasePreviousCommunityArtifacts = jest.fn(async () => {
      storedCommunity = undefined
    })
    Object.assign(manager, {
      logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
      communityState: ServiceState.DEFAULT,
      timedOutAdmissionCommunityId: 'pending-community',
      admissionMutationMutex: new Mutex(),
      launchGeneration: 1,
      communityLifecycle: { drain: jest.fn<() => Promise<void>>().mockResolvedValue() },
      qssService: { close: jest.fn(), resume: jest.fn<() => Promise<void>>().mockResolvedValue() },
      captchaService: { reset: jest.fn() },
      serverIoProvider: { io: { emit: jest.fn() } },
      localDbService,
      storageService: { quietDir },
      sigChainService: {
        activeChainTeamId: 'team',
        getActiveChain: jest.fn(() => ({
          team: null,
          roles: { amIMemberOfRole: jest.fn(() => false) },
        })),
      },
      erasePreviousCommunityArtifacts,
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
    await Promise.resolve()
    await Promise.resolve()
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

  it('does not treat an established chain with a missing member role as provisional', async () => {
    const manager = createManager()
    Object.assign(manager, {
      sigChainService: {
        activeChainTeamId: 'team',
        getActiveChain: jest.fn(() => ({
          team: { id: 'team' },
          isPendingDeviceAdmission: false,
          roles: { amIMemberOfRole: jest.fn(() => false) },
        })),
      },
    })

    await expect(manager.resetAdmission('pending-community')).resolves.toBe(false)
    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
  })

  it.each([true, false])('reports a distinct error only for an admission timeout: %s', async timeout => {
    const manager = createManager()
    const emit = jest.fn()
    Object.assign(manager, {
      localDbService: {
        getCommunity: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id: 'pending-community', teamId: 'team', inviteData: {} }),
        getCurrentCommunity: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id: 'pending-community', teamId: 'team', inviteData: {} }),
        getCommunities: jest.fn(async () => ({
          'pending-community': { id: 'pending-community', teamId: 'team', inviteData: {} },
        })),
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
        getCommunity: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id: 'pending-community', teamId: 'team', inviteData: {} }),
        getCurrentCommunity: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id: 'pending-community', teamId: 'team', inviteData: {} }),
        getCommunities: jest.fn(async () => ({
          'pending-community': { id: 'pending-community', teamId: 'team', inviteData: {} },
        })),
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
        getCommunity: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id: 'pending-community', teamId: 'team', inviteData: {} }),
        getCurrentCommunity: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id: 'pending-community', teamId: 'team', inviteData: {} }),
        getCommunities: jest.fn(async () => ({
          'pending-community': { id: 'pending-community', teamId: 'team', inviteData: {} },
        })),
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

  it.each(['pause', 'close'] as const)(
    'does not authorize destructive reset when a healthy restored launch is cancelled by %s',
    async cancellation => {
      const manager = createManager()
      const emit = jest.fn()
      let rejectLaunch!: (reason: Error) => void
      const heldLaunch = new Promise<void>((_resolve, reject) => {
        rejectLaunch = reject
      })
      const healthyChain = {
        team: { id: 'team' },
        roles: { amIMemberOfRole: jest.fn(() => true) },
        isPendingDeviceAdmission: false,
      }
      Object.assign(manager, {
        localDbService: {
          getCommunity: jest.fn(async () => ({ id: 'healthy-community', teamId: 'team' })),
          setCurrentCommunityId: jest.fn(async () => undefined),
          close: jest.fn(async () => undefined),
        },
        sigChainService: {
          activeChainTeamId: 'team',
          getActiveChain: jest.fn(() => healthyChain),
          deleteChain: jest.fn(async () => undefined),
        },
        serverIoProvider: { io: { emit } },
        qssService: {
          close: jest.fn(),
          pause: jest.fn(),
          resume: jest.fn(async () => undefined),
        },
        launch: jest.fn(() => heldLaunch),
        saveActiveChain: jest.fn(async () => undefined),
        closeSocket: jest.fn(async () => undefined),
        storageService: { quietDir: path.join(receiptRoot, 'backend'), stop: jest.fn(async () => undefined) },
        tor: { kill: jest.fn(async () => undefined) },
        libp2pService: {
          pause: jest.fn(async () => true),
          close: jest.fn(async () => undefined),
        },
      })
      const lifecycle = {
        pause: jest.fn(async (reason: Error) => rejectLaunch(reason)),
        drain: jest.fn(async (reason: Error) => rejectLaunch(reason)),
      }
      manager['communityLifecycle'] = lifecycle as any

      const launch = manager.launchCommunity('healthy-community')
      await Promise.resolve()
      await Promise.resolve()
      if (cancellation === 'pause') {
        await manager.pause()
      } else {
        await manager.closeAllServices()
      }
      await launch

      expect(emit).toHaveBeenCalledWith(
        SocketEvents.ERROR,
        expect.objectContaining({
          type: SocketActions.LAUNCH_COMMUNITY,
          community: 'healthy-community',
          message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        })
      )
      expect(manager['interruptedAdmissionCommunityId']).toBeUndefined()
      expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
      await expect(manager.resetAdmission('healthy-community')).resolves.toBe(false)
      expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    }
  )

  it('purges a provisional admission instead of resuming it after a process restart', async () => {
    const manager = createManager()
    manager['timedOutAdmissionCommunityId'] = undefined
    const interruptedCommunity = { id: 'pending-community', name: 'Quiet', teamId: 'team', inviteData: {} }
    Object.assign(manager, {
      sigChainService: {
        activeChainTeamId: 'team',
        loadChain: jest.fn(async () => undefined),
        getActiveChain: jest.fn(() => ({
          team: null,
          roles: { amIMemberOfRole: jest.fn(() => false) },
        })),
      },
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => interruptedCommunity),
      getCommunity: jest.fn(async () => interruptedCommunity),
      getCommunities: jest.fn(async () => ({ [interruptedCommunity.id]: interruptedCommunity })),
    })
    const launch = jest.spyOn(manager as any, 'launchCommunityLocked').mockResolvedValue(undefined)

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
    expect(launch).not.toHaveBeenCalled()
    expect(manager['interruptedAdmissionCommunityId']).toBeUndefined()
    expect(manager['clearedAdmissionCommunityId']).toBe('pending-community')
    expect(manager['readAdmissionResetReceipt']()?.phase).toBe('complete')
  })

  it.each([
    ['an explicit pending-member snapshot', true, false],
    ['a legacy empty snapshot with its matching interruption marker', undefined, true],
  ])('recovers %s after sigchain loading fails', async (_description, pendingMemberAdmission, writeMarker) => {
    const manager = createManager()
    manager['timedOutAdmissionCommunityId'] = undefined
    const interruptedCommunity = { id: 'pending-community', name: 'Quiet', teamId: 'team', inviteData: {} }
    if (writeMarker) manager['writeInterruptedAdmissionMarker'](interruptedCommunity.id)
    Object.assign(manager, {
      sigChainService: {
        loadChain: jest.fn(async () => {
          throw new Error('missing serialized team')
        }),
      },
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => interruptedCommunity),
      getCommunity: jest.fn(async () => interruptedCommunity),
      getCommunities: jest.fn(async () => ({ [interruptedCommunity.id]: interruptedCommunity })),
      getSigChain: jest.fn(async () => ({
        serializedTeam: undefined,
        teamKeyRing: undefined,
        pendingMemberAdmission,
      })),
    })

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
    expect(manager['readAdmissionResetReceipt']()).toEqual({
      id: interruptedCommunity.id,
      invitationType: 'community',
      phase: 'complete',
    })
  })

  it('preserves a corrupt established snapshot when sigchain loading fails', async () => {
    const manager = createManager()
    const damagedCommunity = { id: 'damaged-community', name: 'Quiet', teamId: 'team', inviteData: {} }
    manager['writeInterruptedAdmissionMarker'](damagedCommunity.id)
    Object.assign(manager, {
      sigChainService: {
        loadChain: jest.fn(async () => {
          throw new Error('missing serialized team')
        }),
      },
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => damagedCommunity),
      getCommunity: jest.fn(async () => damagedCommunity),
      getCommunities: jest.fn(async () => ({ [damagedCommunity.id]: damagedCommunity })),
      getSigChain: jest.fn(async () => ({
        serializedTeam: undefined,
        teamKeyRing: { generation: 0 },
        pendingMemberAdmission: undefined,
      })),
    })

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    expect(manager['readAdmissionResetReceipt']()).toBeUndefined()
  })

  it('preserves an established startup chain whose member role state is damaged', async () => {
    const manager = createManager()
    const damagedCommunity = { id: 'damaged-community', name: 'Quiet', teamId: 'team', inviteData: {} }
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => damagedCommunity),
      getCommunity: jest.fn(async () => damagedCommunity),
      getCommunities: jest.fn(async () => ({ [damagedCommunity.id]: damagedCommunity })),
    })
    Object.assign(manager, {
      sigChainService: {
        activeChainTeamId: 'team',
        loadChain: jest.fn(async () => undefined),
        getActiveChain: jest.fn(() => ({
          team: { id: 'team' },
          isPendingDeviceAdmission: false,
          roles: { amIMemberOfRole: jest.fn(() => false) },
        })),
      },
    })
    const launch = jest.spyOn(manager as any, 'launchCommunityLocked').mockResolvedValue(undefined)

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    expect(manager['readAdmissionResetReceipt']()).toBeUndefined()
    expect(launch).toHaveBeenCalledWith('damaged-community')
  })

  it('acknowledges a completed reset from a new manager using the durable receipt', async () => {
    const quietDir = path.join(receiptRoot, 'backend')
    const firstManager = createManager(quietDir)
    await expect(firstManager.resetAdmission('pending-community')).resolves.toBe(true)

    const restartedManager = createManager(quietDir)
    Object.assign(restartedManager['localDbService'], {
      getCommunity: jest.fn(async () => undefined),
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({})),
    })

    await expect(restartedManager.resetAdmission('pending-community')).resolves.toBe(true)
    expect(restartedManager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    expect(restartedManager['readAdmissionResetReceipt']()).toEqual({
      id: 'pending-community',
      invitationType: 'community',
      phase: 'complete',
    })
  })

  it('replays only completion when a crash leaves an interrupted marker after the complete receipt', async () => {
    const quietDir = path.join(receiptRoot, 'backend')
    const firstManager = createManager(quietDir)
    await expect(firstManager.resetAdmission('pending-community')).resolves.toBe(true)
    fs.writeFileSync(path.join(receiptRoot, '.admission-interrupted'), 'pending-community')

    const restartedManager = createManager(quietDir)
    Object.assign(restartedManager['localDbService'], {
      getCommunity: jest.fn(async () => undefined),
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({})),
    })
    await restartedManager.launchCommunityFromStorage()

    const listeners = new Map<string, () => void>()
    Object.assign(restartedManager, {
      socketService: {
        on: jest.fn((event: string, listener: () => void) => listeners.set(event, listener)),
      },
    })
    restartedManager['attachSocketServiceListeners']()
    listeners.get(SocketActions.START)!()

    expect(restartedManager['interruptedAdmissionCommunityId']).toBeUndefined()
    expect(fs.existsSync(path.join(receiptRoot, '.admission-interrupted'))).toBe(false)
    expect(restartedManager['serverIoProvider'].io.emit).toHaveBeenCalledWith(SocketEvents.ADMISSION_RESET_COMPLETE, {
      id: 'pending-community',
      invitationType: 'community',
    })
    expect(restartedManager['serverIoProvider'].io.emit).not.toHaveBeenCalledWith(
      SocketEvents.ERROR,
      expect.objectContaining({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'pending-community',
        message: ErrorMessages.ADMISSION_INTERRUPTED,
      })
    )
  })

  it('finishes a pending receipt after a process restart following partial erasure', async () => {
    const quietDir = path.join(receiptRoot, 'backend')
    const firstManager = createManager(quietDir)
    jest
      .mocked(firstManager['erasePreviousCommunityArtifacts'])
      .mockRejectedValueOnce(new Error('process stopped during cleanup'))
    await expect(firstManager.resetAdmission('pending-community')).rejects.toThrow('process stopped during cleanup')
    expect(firstManager['readAdmissionResetReceipt']()?.phase).toBe('pending')

    const restartedManager = createManager(quietDir)
    Object.assign(restartedManager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({})),
    })
    await restartedManager.launchCommunityFromStorage()

    expect(restartedManager['erasePreviousCommunityArtifacts']).toHaveBeenCalledTimes(1)
    expect(restartedManager['readAdmissionResetReceipt']()).toEqual({
      id: 'pending-community',
      invitationType: 'community',
      phase: 'complete',
    })
  })

  it('keeps new onboarding behind pending startup receipt recovery', async () => {
    const manager = createManager()
    manager['writeAdmissionResetReceipt']({
      id: 'pending-community',
      invitationType: 'community',
      phase: 'pending',
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({})),
    })
    let finishErase!: () => void
    jest.mocked(manager['erasePreviousCommunityArtifacts']).mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          finishErase = resolve
        })
    )
    const create = jest.spyOn(manager as any, 'createCommunityLocked').mockResolvedValue(undefined)

    const recovery = manager.launchCommunityFromStorage()
    while (finishErase == null) await Promise.resolve()
    const onboarding = manager.createCommunity({ id: 'new-community' } as any)
    await Promise.resolve()
    expect(create).not.toHaveBeenCalled()

    finishErase()
    await recovery
    await onboarding
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('reports pending startup receipt cleanup failure as retryable without reporting completion', async () => {
    const manager = createManager()
    manager['writeAdmissionResetReceipt']({
      id: 'pending-community',
      invitationType: 'device',
      phase: 'pending',
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({})),
    })
    jest.mocked(manager['erasePreviousCommunityArtifacts']).mockRejectedValueOnce(new Error('cleanup failed'))

    await expect(manager.launchCommunityFromStorage()).rejects.toThrow('cleanup failed')

    expect(manager['serverIoProvider'].io.emit).toHaveBeenCalledWith(
      SocketEvents.ERROR,
      expect.objectContaining({
        type: SocketActions.LAUNCH_COMMUNITY,
        community: 'pending-community',
        message: ErrorMessages.ADMISSION_INTERRUPTED,
      })
    )
    expect(manager['serverIoProvider'].io.emit).not.toHaveBeenCalledWith(
      SocketEvents.ADMISSION_RESET_COMPLETE,
      expect.anything()
    )
    expect(manager['readAdmissionResetReceipt']()?.phase).toBe('pending')
  })

  it('refuses a stale pending receipt without erasing or blocking a newer durable community launch', async () => {
    const quietDir = path.join(receiptRoot, 'backend')
    const manager = createManager(quietDir)
    manager['writeAdmissionResetReceipt']({
      id: 'pending-community',
      invitationType: 'device',
      phase: 'pending',
    })
    const newerCommunity = { id: 'new-community', name: 'New', teamId: 'new-team' }
    Object.assign(manager, {
      sigChainService: {
        loadChain: jest.fn(async () => undefined),
        getActiveChain: jest.fn(() => ({
          team: { id: 'new-team' },
          roles: { amIMemberOfRole: jest.fn(() => true) },
        })),
      },
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => newerCommunity),
      getCommunities: jest.fn(async () => ({ [newerCommunity.id]: newerCommunity })),
    })
    const launch = jest.spyOn(manager as any, 'launchCommunityLocked').mockResolvedValue(undefined)

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    expect(launch).toHaveBeenCalledWith('new-community')
    expect(manager['readAdmissionResetReceipt']()?.phase).toBe('pending')
  })

  it('refuses a stale receipt when a newer community row exists before its current-id write', async () => {
    const manager = createManager()
    manager['writeAdmissionResetReceipt']({
      id: 'pending-community',
      invitationType: 'community',
      phase: 'pending',
    })
    const newerCommunity = { id: 'partially-created-community', name: 'New', teamId: 'new-team' }
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({ [newerCommunity.id]: newerCommunity })),
    })

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    expect(manager['readAdmissionResetReceipt']()?.phase).toBe('pending')
  })

  it('replays a completed receipt after the frontend starts and clears it before new admission', async () => {
    const manager = createManager()
    await expect(manager.resetAdmission('pending-community')).resolves.toBe(true)
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => undefined),
      getCommunities: jest.fn(async () => ({})),
    })
    const listeners = new Map<string, () => void>()
    Object.assign(manager, {
      socketService: {
        on: jest.fn((event: string, listener: () => void) => listeners.set(event, listener)),
      },
    })
    manager['attachSocketServiceListeners']()

    listeners.get(SocketActions.START)!()
    expect(manager['serverIoProvider'].io.emit).toHaveBeenCalledWith(SocketEvents.ADMISSION_RESET_COMPLETE, {
      id: 'pending-community',
      invitationType: 'community',
    })
    await expect(manager['prepareForNewAdmission']()).resolves.toBe(true)
    expect(manager['readAdmissionResetReceipt']()).toBeUndefined()
  })

  it('launches a fully persisted admission after a process restart', async () => {
    const manager = createManager()
    manager['timedOutAdmissionCommunityId'] = undefined
    const completedCommunity = { id: 'completed-community', name: 'Quiet', teamId: 'team' }
    Object.assign(manager, {
      sigChainService: {
        loadChain: jest.fn(async () => undefined),
        getActiveChain: jest.fn(() => ({
          team: { id: 'team' },
          roles: { amIMemberOfRole: jest.fn(() => true) },
        })),
      },
    })
    Object.assign(manager['localDbService'], {
      getCurrentCommunity: jest.fn(async () => completedCommunity),
      getCommunities: jest.fn(async () => ({ [completedCommunity.id]: completedCommunity })),
    })
    const launch = jest.spyOn(manager as any, 'launchCommunityLocked').mockResolvedValue(undefined)

    await manager.launchCommunityFromStorage()

    expect(manager['erasePreviousCommunityArtifacts']).not.toHaveBeenCalled()
    expect(launch).toHaveBeenCalledWith('completed-community')
    expect(manager['interruptedAdmissionCommunityId']).toBeUndefined()
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
