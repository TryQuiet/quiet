import { EventEmitter } from 'events'
import { type ChildProcess } from 'child_process'
import { createLeaveCommunityHandler } from './leaveCommunity'

const createBackend = () => {
  const backend = new EventEmitter() as ChildProcess
  backend.send = jest.fn().mockReturnValue(true)
  return backend
}

describe('desktop community cleanup IPC', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }

  it('sends only one leave for repeated requests and waits for its own completion', async () => {
    const backend = createBackend()
    const setResetting = jest.fn()
    const leave = createLeaveCommunityHandler({ getBackendProcess: () => backend, setResetting, logger })
    const first = leave()
    const second = leave()
    expect(second).toBe(first)
    expect(backend.send).toHaveBeenCalledTimes(1)
    const request = (backend.send as jest.Mock).mock.calls[0][0]
    expect(request).toEqual({ type: 'leaveCommunity', requestId: expect.any(String) })

    backend.emit('message', 'leftCommunity')
    backend.emit('message', { type: 'leftCommunity', success: true })
    backend.emit('message', { type: 'leftCommunity', requestId: 'an-earlier-leave', success: true })
    await Promise.resolve()
    expect(setResetting.mock.calls).toEqual([[true]])

    backend.emit('message', { type: 'leftCommunity', requestId: request.requestId, success: true })
    expect(await Promise.all([first, second])).toEqual([true, true])
    expect(setResetting.mock.calls).toEqual([[true], [false]])
    expect(backend.eventNames()).toEqual([])
  })

  it('retries failed cleanup and ignores a late duplicate reply from the failed request', async () => {
    const backend = createBackend()
    const setResetting = jest.fn()
    const leave = createLeaveCommunityHandler({ getBackendProcess: () => backend, setResetting, logger })
    const first = leave()
    const oldId = (backend.send as jest.Mock).mock.calls[0][0].requestId
    backend.emit('message', { type: 'leftCommunity', requestId: oldId, success: false })
    await expect(first).resolves.toBe(false)

    const retry = leave()
    const newId = (backend.send as jest.Mock).mock.calls[1][0].requestId
    expect(newId).not.toBe(oldId)
    backend.emit('message', { type: 'leftCommunity', requestId: oldId, success: true })
    await Promise.resolve()
    expect(setResetting).toHaveBeenLastCalledWith(true)
    backend.emit('message', { type: 'leftCommunity', requestId: newId, success: true })
    await expect(retry).resolves.toBe(true)
    expect(backend.eventNames()).toEqual([])
  })

  it.each(['close', 'error', 'disconnect'])(
    'fails all callers on backend %s and removes listeners before retrying',
    async event => {
      const backend = createBackend()
      const leave = createLeaveCommunityHandler({ getBackendProcess: () => backend, setResetting: jest.fn(), logger })
      const first = leave()
      const duplicate = leave()
      backend.emit(event, new Error('backend failed'))
      expect(await Promise.all([first, duplicate])).toEqual([false, false])
      expect(backend.eventNames()).toEqual([])
      const retry = leave()
      const id = (backend.send as jest.Mock).mock.calls[1][0].requestId
      backend.emit('message', { type: 'leftCommunity', requestId: id, success: true })
      await expect(retry).resolves.toBe(true)
    }
  )

  it.each(['throw', 'callback'])('recovers after IPC send fails via %s', async failure => {
    const backend = createBackend()
    ;(backend.send as jest.Mock).mockImplementationOnce((_request, callback) => {
      if (failure === 'throw') throw new Error('send failed')
      callback(new Error('send failed'))
    })
    const leave = createLeaveCommunityHandler({ getBackendProcess: () => backend, setResetting: jest.fn(), logger })
    await expect(leave()).resolves.toBe(false)
    expect(backend.eventNames()).toEqual([])
    const retry = leave()
    const request = (backend.send as jest.Mock).mock.calls[1][0]
    backend.emit('message', { ...request, type: 'leftCommunity', success: true })
    await expect(retry).resolves.toBe(true)
  })
})
