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

  it('does not present the challenge again after the user declined it', async () => {
    const first = captchaService.getToken('site-key')
    socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, { error: 'Captcha cancelled by user' })
    await expect(first).resolves.toBeNull()
    expect(captchaService.declinedByUser).toBe(true)
    serverIoProvider.io.emit.mockClear()

    // Automatic retries (e.g. QSS reporting "captcha required" again) resolve null without a new challenge.
    await expect(captchaService.getToken('site-key')).resolves.toBeNull()
    expect(serverIoProvider.io.emit).not.toHaveBeenCalledWith(SocketEvents.HCAPTCHA_CHALLENGE_REQUEST, {})
    expect(captchaService.hcaptchaRequestPending).toBe(false)
  })

  it('presents the challenge again once the client asks for verification', async () => {
    const first = captchaService.getToken('site-key')
    socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, { error: 'Captcha cancelled by user' })
    await first
    serverIoProvider.io.emit.mockClear()

    captchaService.acknowledgeClientRequest()
    expect(captchaService.declinedByUser).toBe(false)
    const second = captchaService.getToken('site-key')
    expect(serverIoProvider.io.emit).toHaveBeenCalledWith(SocketEvents.HCAPTCHA_CHALLENGE_REQUEST, {})
    socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, { token: 'fresh-token' })
    await expect(second).resolves.toBe('fresh-token')
    expect(captchaService.declinedByUser).toBe(false)
  })

  it('clears the declined state on reset', async () => {
    const first = captchaService.getToken('site-key')
    socketService.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, {})
    await first
    expect(captchaService.declinedByUser).toBe(true)
    captchaService.reset()
    expect(captchaService.declinedByUser).toBe(false)
  })
})
