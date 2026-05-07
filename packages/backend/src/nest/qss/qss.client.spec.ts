import { jest } from '@jest/globals'
import EventEmitter from 'node:events'
import { type Socket as ClientSocket } from 'socket.io-client'
import { type QSSClient as QSSClientType } from './qss.client'

const connectMock = jest.fn()

jest.unstable_mockModule('socket.io-client', () => ({
  connect: connectMock,
}))

jest.unstable_mockModule('../captcha/captcha.service', () => ({
  CaptchaService: class {},
}))

jest.unstable_mockModule('../common/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    warn: jest.fn(),
  }),
}))

class MockCompoundError extends Error {
  public original?: Error

  constructor(message: string, original?: Error) {
    super(message)
    this.original = original
  }
}

jest.unstable_mockModule('@quiet/types', () => ({
  CaptchaErrorMessages: {
    CATCHA_VERIFICATION_REQUIRED: 'captcha verification required',
  },
  CompoundError: MockCompoundError,
  SocketEvents: {
    HCAPTCHA_SITE_KEY: 'hcaptchaSiteKey',
    HCAPTCHA_VERIFICATION_UPDATE: 'hcaptchaVerificationUpdate',
  },
}))

class MockQSSConnectionError extends Error {}
class MockQSSNotInitializedError extends Error {}

jest.unstable_mockModule('./qss.types', () => ({
  CommunityOperationStatus: {
    SENDING: 'sending',
    SUCCESS: 'success',
  },
  QSSConnectionError: MockQSSConnectionError,
  QSSEvents: {
    QSS_CONNECTED: 'qssConnected',
    QSS_DISCONNECTED: 'qssDisconnected',
    QSS_CAPTCHA_REQUIRED: 'qssCaptchaRequired',
  },
  QSSNotInitializedError: MockQSSNotInitializedError,
  WebsocketEvents: {},
}))

let QSSClient: typeof QSSClientType

class PendingClientSocket extends EventEmitter {
  public active = false
  public connected = false
  public id: string
  public connect = jest.fn()
  public close = jest.fn(() => {
    this.active = false
    this.connected = false
  })
  public onAny = jest.fn()
  public offAny = jest.fn()

  constructor(id: string) {
    super()
    this.id = id
  }

  public emitConnect(): void {
    this.active = true
    this.connected = true
    this.emit('connect')
  }
}

const connectOptions = {
  autoConnect: false,
  forceNew: false,
  transports: ['websocket'],
}

describe('QSSClient', () => {
  beforeAll(async () => {
    const qssClientModule = await import('./qss.client')
    QSSClient = qssClientModule.QSSClient
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('coalesces concurrent connection requests for the same endpoint', async () => {
    const socketA = new PendingClientSocket('socket-a')
    connectMock.mockReturnValue(socketA as any as ClientSocket)
    const client = new QSSClient(
      true,
      'ws://default-qss',
      { io: { emit: jest.fn() } } as any,
      { getToken: jest.fn() } as any
    )

    const firstConnect = client.createSocketAndConnect('ws://qss-a')
    const secondConnect = client.createSocketAndConnect('ws://qss-a')

    expect(connectMock).toHaveBeenCalledTimes(1)
    expect(connectMock).toHaveBeenCalledWith('ws://qss-a', connectOptions)
    expect(socketA.connect).toHaveBeenCalledTimes(1)

    socketA.emitConnect()

    await expect(firstConnect).resolves.toBe(socketA)
    await expect(secondConnect).resolves.toBe(socketA)
    expect(socketA.close).not.toHaveBeenCalled()
  })

  it('does not satisfy a newer endpoint request with an abandoned endpoint connection', async () => {
    const socketA = new PendingClientSocket('socket-a')
    const socketB = new PendingClientSocket('socket-b')
    connectMock.mockImplementation((endpoint: unknown) => {
      if (endpoint === 'ws://old-qss') {
        return socketA as any as ClientSocket
      }
      return socketB as any as ClientSocket
    })
    const client = new QSSClient(
      true,
      'ws://default-qss',
      { io: { emit: jest.fn() } } as any,
      { getToken: jest.fn() } as any
    )

    const abandonedConnect = client.createSocketAndConnect('ws://old-qss')
    const abandonedError = abandonedConnect.catch(error => error)
    const replacementConnect = client.createSocketAndConnect('ws://new-qss')

    expect(connectMock).toHaveBeenCalledTimes(2)
    expect(connectMock).toHaveBeenNthCalledWith(1, 'ws://old-qss', connectOptions)
    expect(connectMock).toHaveBeenNthCalledWith(2, 'ws://new-qss', connectOptions)
    expect(socketA.close).toHaveBeenCalledTimes(1)
    expect(socketB.connect).toHaveBeenCalledTimes(1)

    socketB.emitConnect()

    await expect(abandonedError).resolves.toBeInstanceOf(MockCompoundError)
    await expect(replacementConnect).resolves.toBe(socketB)
  })
})
