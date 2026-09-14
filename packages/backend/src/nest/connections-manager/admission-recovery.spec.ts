import { expect, jest } from '@jest/globals'

import { ConnectionsManagerService } from './connections-manager.service'
import { AdmissionError, ServiceState } from './connections-manager.types'

describe('pending device admission recovery', () => {
  const createManager = () => {
    const manager = Object.create(ConnectionsManagerService.prototype) as ConnectionsManagerService
    Object.assign(manager, {
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      communityState: ServiceState.DEFAULT,
      admissionGeneration: 1,
      timedOutAdmissionCommunityId: 'pending-community',
      qssService: { close: jest.fn(), resume: jest.fn(async () => undefined) },
      captchaService: { reset: jest.fn() },
      erasePreviousCommunityArtifacts: jest.fn(async () => undefined),
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
})
