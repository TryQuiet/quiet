import { jest } from '@jest/globals'
import { CommunityLifecycle } from './community-lifecycle'
import { AdmissionResourceScope } from './admission-resource-scope'
import { AdmissionProtocolGate } from './admission-protocol-gate'

it('stops buffered delivery when the first published callback revokes its lifecycle', async () => {
  const scope = new AdmissionResourceScope()
  const gate = new AdmissionProtocolGate(scope)
  const lease = new CommunityLifecycle('community', {} as any)
  const cleanup = jest.fn(async () => undefined)
  scope.own(cleanup)
  gate.freeze()
  const first = jest.fn(() => lease.revoke(new Error('community switched')))
  const stale = jest.fn()
  gate.deliver(first)
  gate.deliver(stale)
  lease.adopt(scope, gate)
  gate.resume()
  gate.resume()
  gate.deliver(stale)
  expect(first).toHaveBeenCalledTimes(1)
  expect(stale).not.toHaveBeenCalled()
  await Promise.all([lease.drain(new Error('shutdown')), lease.drain(new Error('shutdown again'))])
  expect(cleanup).toHaveBeenCalledTimes(1)
})

it('rejects queued protocol work when its adopted lifecycle pauses before the callback starts', async () => {
  const scope = new AdmissionResourceScope()
  const gate = new AdmissionProtocolGate(scope)
  const lease = new CommunityLifecycle('community', {} as any)
  const cleanup = jest.fn(async () => undefined)
  scope.own(cleanup)
  lease.adopt(scope, gate)
  const callback = jest.fn(async () => undefined)
  const operation = gate.run(callback)
  const reason = new Error('pause before queued callback')
  const rejected = expect(operation).rejects.toBe(reason)
  await lease.pause(reason)
  await rejected
  expect(callback).not.toHaveBeenCalled()
  expect(cleanup).not.toHaveBeenCalled()
  await lease.drain(reason)
  expect(cleanup).toHaveBeenCalledTimes(1)
})

it('waits for adopted in-flight work before concurrent shutdown callers clean up', async () => {
  const scope = new AdmissionResourceScope()
  const gate = new AdmissionProtocolGate(scope)
  const lease = new CommunityLifecycle('community', {} as any)
  const cleanup = jest.fn(async () => undefined)
  scope.own(cleanup)
  lease.adopt(scope, gate)
  let finish!: () => void
  let started!: () => void
  const running = new Promise<void>(resolve => {
    started = resolve
  })
  const pending = new Promise<void>(resolve => {
    finish = resolve
  })
  const operation = gate.run(async () => {
    started()
    await pending
  })
  await running
  let stopped = false
  const shutdown = Promise.all([lease.drain(new Error('shutdown')), lease.drain(new Error('shutdown again'))])
  void shutdown.then(() => {
    stopped = true
  })
  await new Promise<void>(resolve => setImmediate(resolve))
  expect(stopped).toBe(false)
  expect(cleanup).not.toHaveBeenCalled()
  finish()
  await operation
  await shutdown
  expect(cleanup).toHaveBeenCalledTimes(1)
})

it('reports adopted cleanup failure consistently to concurrent and later shutdown callers', async () => {
  const scope = new AdmissionResourceScope()
  const gate = new AdmissionProtocolGate(scope)
  const lease = new CommunityLifecycle('community', {} as any)
  const failure = new Error('socket close failed')
  const failed = jest.fn(async () => {
    throw failure
  })
  const other = jest.fn(async () => undefined)
  scope.own(failed)
  scope.own(other)
  lease.adopt(scope, gate)
  const reason = new Error('shutdown')
  const results = await Promise.allSettled([lease.drain(reason), lease.drain(reason)])
  for (const result of results) expect(result).toMatchObject({ status: 'rejected', reason: failure })
  await expect(lease.drain(reason)).rejects.toBe(failure)
  expect(failed).toHaveBeenCalledTimes(1)
  expect(other).toHaveBeenCalledTimes(1)
  expect(gate.closed).toBe(true)
})
