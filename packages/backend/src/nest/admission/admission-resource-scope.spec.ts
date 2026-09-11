import { jest } from '@jest/globals'
import { AdmissionResourceScope } from './admission-resource-scope'

it('closes a late allocation before drain settles and runs cleanup only once', async () => {
  const scope = new AdmissionResourceScope()
  let allocate!: () => void
  let resource = false
  const close = jest.fn(async () => {
    expect(resource).toBe(true)
    resource = false
  })
  scope.own(close)
  const operation = scope.run(async () => {
    await new Promise<void>(resolve => {
      allocate = resolve
    })
    resource = true
  })
  await Promise.resolve()
  const reason = new Error('cancelled')
  const drain = scope.drain(reason)
  expect(scope.drain(reason)).toBe(drain)
  expect(close).not.toHaveBeenCalled()
  allocate()
  await operation
  await drain
  expect(close).toHaveBeenCalledTimes(1)
  expect(resource).toBe(false)
  expect(() => scope.run(async () => undefined)).toThrow(reason)
})

it('transfers cleanup ownership without closing the winning resource', async () => {
  const attempt = new AdmissionResourceScope()
  const lifecycle = new AdmissionResourceScope()
  const cleanup = jest.fn(async () => undefined)
  attempt.own(cleanup)
  attempt.transferTo(lifecycle)
  await attempt.drain(new Error('attempt finished'))
  expect(cleanup).not.toHaveBeenCalled()
  await lifecycle.drain(new Error('shutdown'))
  expect(cleanup).toHaveBeenCalledTimes(1)
})

it('reports cleanup failure and still attempts every registered cleanup', async () => {
  const scope = new AdmissionResourceScope()
  const failed = jest.fn(async () => {
    throw new Error('cannot close')
  })
  const other = jest.fn(async () => undefined)
  scope.own(failed)
  scope.own(other)
  await expect(scope.drain(new Error('cancel'))).rejects.toThrow('cannot close')
  expect(other).toHaveBeenCalledTimes(1)
})
