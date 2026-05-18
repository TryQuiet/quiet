import { EventEmitter } from 'events'
import { jest } from '@jest/globals'
import { SocketActions, SocketEvents } from '@quiet/types'
import { CaptchaService } from './captcha.service'

describe('CaptchaService', () => {
  let socketService: EventEmitter
  let serverIoProvider: { io: { emit: ReturnType<typeof jest.fn> } }
  let captchaService: CaptchaService

  beforeEach(async () => {
    socketService = new EventEmitter()
    serverIoProvider = { io: { emit: jest.fn() } }
    captchaService = new CaptchaService(serverIoProvider as any, undefined, socketService as any)
    await captchaService.onModuleInit()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('keeps waiting for a slow hCaptcha form response instead of timing out', async () => {
    jest.useFakeTimers()

    const tokenPromise = captchaService.getToken('site-key')

    expect(serverIoProvider.io.emit).toHaveBeenCalledWith(SocketEvents.HCAPTCHA_CHALLENGE_REQUEST, {})

    await jest.advanceTimersByTimeAsync(30_001)

    const pending = Symbol('pending')
    await expect(Promise.race([tokenPromise, Promise.resolve(pending)])).resolves.toBe(pending)

    socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, { token: 'slow-token' })

    await expect(tokenPromise).resolves.toBe('slow-token')
    expect(captchaService.hcaptchaRequestPending).toBe(false)
  })

  it('resolves pending hCaptcha requests when the client reports an error', async () => {
    const tokenPromise = captchaService.getToken('site-key')

    socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, { error: 'Captcha cancelled by user' })

    await expect(tokenPromise).resolves.toBeNull()
    expect(captchaService.hcaptchaRequestPending).toBe(false)
  })
})
