import { jest } from '@jest/globals'
import { QssAdmissionAdapter } from './qss-admission.adapter'
import { P2pAdmissionAdapter } from './p2p-admission.adapter'
import { AdmissionResourceScope } from './admission-resource-scope'
import { AdmissionLifecycle } from './admission-lifecycle'
import { QSSOperationResult } from '../qss/qss.types'

it.each(['qss', 'p2p'])('%s closes late startup and cannot send admission after revocation', async transport => {
  let finish!: () => void
  const pending = new Promise<void>(resolve => {
    finish = resolve
  })
  const scope = new AdmissionResourceScope()
  const lease = new AdmissionLifecycle('community', 1, {} as any, 'wss://qss')
  const context = { request: { teamId: 'team' }, chain: {}, revoke: jest.fn() } as any
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
  expect(context.revoke).toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  finish()
  await expect(startup).rejects.toBe(reason)
  await stopped
  expect(close).toHaveBeenCalledTimes(1)
  expect(startAuth).not.toHaveBeenCalled()
})

it.each(['qss', 'p2p'])('%s revokes candidate authority when its adopted lifecycle is closed', async transport => {
  const scope = new AdmissionResourceScope()
  const lease = new AdmissionLifecycle('community', 1, {} as any, 'wss://qss')
  const context = { revoke: jest.fn() } as any
  const service = { pause: jest.fn(), clearAdmissionContext: jest.fn(), close: jest.fn(async () => undefined) }
  const adapter =
    transport === 'qss' ? new QssAdmissionAdapter(service as any) : new P2pAdmissionAdapter(service as any)
  adapter.create({ context, scope, lease })
  scope.transferTo(lease.resources)
  expect(context.revoke).not.toHaveBeenCalled()
  await lease.drain(new Error('close adopted resource'))
  expect(context.revoke).toHaveBeenCalledTimes(1)
})
