import { jest } from '@jest/globals'
import { QssAdmissionAdapter } from './qss-admission.adapter'
import { P2pAdmissionAdapter } from './p2p-admission.adapter'
import { AdmissionResourceScope } from './admission-resource-scope'
import { createAdmissionAuthContext } from './admission-auth-context'
import { CommunityLifecycle } from './community-lifecycle'
import { QSSOperationResult } from '../qss/qss.types'

it.each(['qss', 'p2p'])('%s closes late startup and cannot send admission after revocation', async transport => {
  let finish!: () => void
  const pending = new Promise<void>(resolve => {
    finish = resolve
  })
  const scope = new AdmissionResourceScope()
  const lease = new CommunityLifecycle('community', {} as any, 'wss://qss')
  const { context } = createAdmissionAuthContext({
    attemptId: 1,
    request: { teamId: 'team' } as any,
    transport: transport as any,
    chain: {} as any,
    submit: jest.fn() as any,
    fail: jest.fn(),
    scope,
  })
  const close = jest.fn(async () => undefined)
  const startAuth = jest.fn(async () => undefined)
  const service =
    transport === 'qss'
      ? {
          connectForAdmission: async () => {
            await pending
            return QSSOperationResult.SUCCESS
          },
          prepareAdmission: startAuth,
          pause: close,
        }
      : { setAdmissionContext: jest.fn(), createInstance: async () => pending, clearAdmissionContext: jest.fn(), close }
  const adapter =
    transport === 'qss' ? new QssAdmissionAdapter(service as any) : new P2pAdmissionAdapter(service as any)
  const attempt = adapter.create({ context, scope, lease })
  const startup = transport === 'qss' ? attempt.prepare() : attempt.start()
  await Promise.resolve()
  const reason = new Error('cancel')
  const stopped = attempt.stop(reason)
  expect(context.gate.closed).toBe(true)
  expect(close).not.toHaveBeenCalled()
  finish()
  await expect(startup).rejects.toBe(reason)
  await stopped
  expect(close).toHaveBeenCalledTimes(1)
  expect(startAuth).not.toHaveBeenCalled()
})

it.each(['qss', 'p2p'])('%s revokes candidate authority when its adopted lifecycle is closed', async transport => {
  const scope = new AdmissionResourceScope()
  const lease = new CommunityLifecycle('community', {} as any, 'wss://qss')
  const { context, gate } = createAdmissionAuthContext({
    attemptId: 1,
    request: {} as any,
    transport: transport as any,
    chain: {} as any,
    submit: jest.fn() as any,
    fail: jest.fn(),
    scope,
  })
  const service = { pause: jest.fn(), clearAdmissionContext: jest.fn(), close: jest.fn(async () => undefined) }
  const adapter =
    transport === 'qss' ? new QssAdmissionAdapter(service as any) : new P2pAdmissionAdapter(service as any)
  adapter.create({ context, scope, lease })
  lease.adopt(scope, gate)
  expect(context.gate.closed).toBe(false)
  await lease.drain(new Error('close adopted resource'))
  expect(context.gate.closed).toBe(true)
})
