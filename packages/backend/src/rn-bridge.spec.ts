import { jest } from '@jest/globals'

const logger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}

jest.unstable_mockModule('./nest/common/logger', () => ({
  createLogger: () => logger,
}))

const { EventChannel, default: initRnBridge } = await import('./rn-bridge')

const loggedValues = (): string => JSON.stringify(Object.values(logger).flatMap(mock => mock.mock.calls))

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
