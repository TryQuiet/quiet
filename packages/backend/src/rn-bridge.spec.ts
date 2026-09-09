import { jest } from '@jest/globals'

import { MobileLifecycleCoordinator } from './mobile-lifecycle-coordinator'
import { registerMobileSystemPause } from './mobile-system-pause'

const logger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}

jest.unstable_mockModule('./nest/common/logger', () => ({
  createLogger: () => logger,
}))

const { EventChannel, SystemEventLock, default: initRnBridge } = await import('./rn-bridge')

const loggedValues = (): string => JSON.stringify(Object.values(logger).flatMap(mock => mock.mock.calls))

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

describe('rn-bridge native lifecycle wire format', () => {
  it('wraps lifecycle messages in the same message envelope consumed by iOS and Android', () => {
    const sendMessage = jest.fn()
    const binding = jest.spyOn(process, '_linkedBinding').mockReturnValue({ sendMessage, registerChannel: jest.fn() })
    try {
      const bridge = initRnBridge()
      bridge.channel.send('backendReady')
      expect(sendMessage).toHaveBeenLastCalledWith('_EVENTS_', '{"event":"message","payload":"[\\"backendReady\\"]"}')
      bridge.channel.send('backendClosed')
      expect(sendMessage).toHaveBeenLastCalledWith('_EVENTS_', '{"event":"message","payload":"[\\"backendClosed\\"]"}')
      bridge.channel.send('readyForSecret', 'test-nonce')
      expect(JSON.parse(sendMessage.mock.calls.at(-1)![1] as string)).toEqual({
        event: 'message',
        payload: JSON.stringify(['readyForSecret', 'test-nonce']),
      })
    } finally {
      binding.mockRestore()
    }
  })

  it('acknowledges a system pause immediately when startup has registered no listeners', async () => {
    const sendMessage = jest.fn()
    const listeners = new Map<string, (channelName: string, data: string) => void>()
    const registerChannel = jest.fn((name: string, listener: (channelName: string, data: string) => void) => {
      listeners.set(name, listener)
    })
    const binding = jest.spyOn(process, '_linkedBinding').mockReturnValue({ sendMessage, registerChannel })
    try {
      initRnBridge()
      listeners.get('_SYSTEM_')!('_SYSTEM_', 'pause|startup-pause')
      await new Promise<void>(resolve => setImmediate(resolve))

      expect(sendMessage).toHaveBeenCalledWith('_SYSTEM_', 'release-pause-event|startup-pause')
    } finally {
      binding.mockRestore()
    }
  })

  it('passes the native pause identifier to system listeners', async () => {
    const sendMessage = jest.fn()
    const listeners = new Map<string, (channelName: string, data: string) => void>()
    const registerChannel = jest.fn((name: string, listener: (channelName: string, data: string) => void) => {
      listeners.set(name, listener)
    })
    const binding = jest.spyOn(process, '_linkedBinding').mockReturnValue({ sendMessage, registerChannel })
    try {
      const bridge = initRnBridge()
      const pauseListener = jest.fn((lock: InstanceType<typeof SystemEventLock>) => lock.release())
      bridge.app.on('pause', pauseListener)
      listeners.get('_SYSTEM_')!('_SYSTEM_', 'pause|correlation-id')
      await new Promise<void>(resolve => setImmediate(resolve))

      expect(pauseListener.mock.calls[0][0].eventId).toBe('correlation-id')
      expect(sendMessage).toHaveBeenCalledWith('_SYSTEM_', 'release-pause-event|correlation-id')
    } finally {
      binding.mockRestore()
    }
  })

  it('applies system lifecycle intents in wire order and converges on the latest pause', async () => {
    const sendMessage = jest.fn()
    const listeners = new Map<string, (channelName: string, data: string) => void>()
    const registerChannel = jest.fn((name: string, listener: (channelName: string, data: string) => void) => {
      listeners.set(name, listener)
    })
    const binding = jest.spyOn(process, '_linkedBinding').mockReturnValue({ sendMessage, registerChannel })
    const pauseDeferred = deferred<void>()
    const pause = jest.fn(() => pauseDeferred.promise)
    const activate = jest.fn(async () => undefined)
    try {
      const bridge = initRnBridge()
      const lifecycle = new MobileLifecycleCoordinator({ pause, activate })
      const openPayloads: unknown[] = []
      registerMobileSystemPause(bridge.app, lifecycle, { error: jest.fn() })
      bridge.app.on('resume', () => void lifecycle.resume())
      bridge.app.on('open', payload => {
        openPayloads.push(payload)
        void lifecycle.activate(payload as never)
      })

      const systemListener = listeners.get('_SYSTEM_')!
      systemListener('_SYSTEM_', 'pause|first-pause')
      await new Promise<void>(resolve => setImmediate(resolve))
      systemListener('_SYSTEM_', 'lifecycle|{"event":"resume","payload":{}}')
      systemListener(
        '_SYSTEM_',
        'lifecycle|{"event":"open","payload":{"authCookie":"cookie","httpTunnelPort":12345,"torControlPort":23456}}'
      )
      systemListener('_SYSTEM_', 'pause|latest-pause')
      await new Promise<void>(resolve => setImmediate(resolve))

      pauseDeferred.resolve()
      await new Promise<void>(resolve => setImmediate(resolve))
      await new Promise<void>(resolve => setImmediate(resolve))

      expect(openPayloads).toEqual([{ authCookie: 'cookie', httpTunnelPort: 12345, torControlPort: 23456 }])
      expect(pause).toHaveBeenCalledTimes(1)
      expect(activate).not.toHaveBeenCalled()
      expect(sendMessage).toHaveBeenCalledWith('_SYSTEM_', 'release-pause-event|first-pause')
      expect(sendMessage).toHaveBeenCalledWith('_SYSTEM_', 'release-pause-event|latest-pause')
    } finally {
      binding.mockRestore()
    }
  })
})

describe('rn-bridge logging', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs event metadata without logging a valid secret payload', async () => {
    const socketIOSecret = 'socket-secret-sentinel'
    const authCookie = 'auth-cookie-sentinel'
    const nonce = 'nonce-sentinel'
    const channel = new EventChannel('_EVENTS_')

    channel.processData(
      JSON.stringify({
        event: 'secret',
        payload: JSON.stringify([{ socketIOSecret, authCookie, nonce }]),
      })
    )
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(logger.info).toHaveBeenCalledWith('EventChannel received event', {
      event: 'secret',
      payloadType: 'array',
      payloadItemCount: 1,
    })
    expect(loggedValues()).not.toContain(socketIOSecret)
    expect(loggedValues()).not.toContain(authCookie)
    expect(loggedValues()).not.toContain(nonce)
  })

  it('does not log malformed legacy payload contents', async () => {
    const socketIOSecret = 'malformed-socket-secret-sentinel'
    const authCookie = 'malformed-auth-cookie-sentinel'
    const malformedEntry = 'malformed-nonce-sentinel'
    const channel = new EventChannel('_EVENTS_')

    channel.processData(
      JSON.stringify({
        event: 'secret',
        payload: `socketIOSecret:${socketIOSecret}|authCookie:${authCookie}|${malformedEntry}`,
      })
    )
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(logger.warn).toHaveBeenCalledWith('Malformed rn-bridge entry', { index: 2 })
    expect(loggedValues()).not.toContain(socketIOSecret)
    expect(loggedValues()).not.toContain(authCookie)
    expect(loggedValues()).not.toContain(malformedEntry)
  })

  it('does not log a malformed envelope payload', () => {
    const secretPayload = 'malformed-envelope-secret-sentinel'
    const channel = new EventChannel('_EVENTS_')

    expect(() => channel.processData(JSON.stringify({ payload: secretPayload }))).toThrow('Malformed message envelope')

    expect(loggedValues()).not.toContain(secretPayload)
  })
})
