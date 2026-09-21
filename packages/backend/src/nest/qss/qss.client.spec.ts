import { jest } from '@jest/globals'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import EventEmitter from 'node:events'
import { QSSClient } from './qss.client'
import { CaptchaService } from '../captcha/captcha.service'
import { SocketService } from '../socket/socket.service'
import { ServerIoProviderTypes } from '../types'
import { CaptchaErrorMessages, SocketEvents } from '@quiet/types'
import { CommunityOperationStatus, QSSEvents, WebsocketEvents } from './qss.types'

describe('QSS captcha verification state', () => {
  it('invalidates renderer state before requesting a new challenge and on disconnect', async () => {
    const httpServer = createServer()
    const server = new Server(httpServer, { transports: ['websocket', 'polling'] })
    server.on('connection', socket => {
      socket.on(WebsocketEvents.VERIFY_CAPTCHA, (_message, ack) => ack({ status: CommunityOperationStatus.SUCCESS }))
      socket.on(WebsocketEvents.GET_CAPTCHA_SITE_KEY, (_message, ack) =>
        ack({ status: CommunityOperationStatus.SUCCESS, payload: { siteKey: 'test-site-key' } })
      )
      socket.on(WebsocketEvents.GEN_PUB_KEYS, (_message, ack) =>
        ack({ status: CommunityOperationStatus.ERROR, reason: CaptchaErrorMessages.CATCHA_VERIFICATION_REQUIRED })
      )
    })
    await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', resolve))
    const address = httpServer.address()
    if (address == null || typeof address === 'string') throw new Error('Expected TCP address')
    const endpoint = `http://127.0.0.1:${address.port}`
    const frontend = new EventEmitter()
    let rendererVerified = false
    frontend.on(SocketEvents.HCAPTCHA_VERIFICATION_UPDATE, value => {
      rendererVerified = value
    })
    const serverIoProvider = { io: frontend } as unknown as ServerIoProviderTypes
    const captcha = new CaptchaService(serverIoProvider, endpoint, new EventEmitter() as SocketService)
    const client = new QSSClient(true, endpoint, serverIoProvider, captcha)
    const getToken = jest.spyOn(captcha, 'getToken').mockImplementation(async () => {
      expect(rendererVerified).toBe(false)
      return 'fresh-token'
    })
    let renewed: Promise<boolean> | undefined
    client.on(QSSEvents.QSS_CAPTCHA_REQUIRED, () => {
      expect(client.captchaVerified).toBe(false)
      expect(rendererVerified).toBe(false)
      renewed = client.requestCaptchaVerification()
    })

    try {
      await client.createSocketAndConnect(endpoint)
      await expect(client.verifyCaptchaToken('initial-token')).resolves.toBe(true)
      expect(rendererVerified).toBe(true)
      await client.sendMessage(WebsocketEvents.GEN_PUB_KEYS, { payload: { teamId: 'team' } }, true)
      await expect(renewed).resolves.toBe(true)
      expect(getToken).toHaveBeenCalledTimes(1)
      expect(rendererVerified).toBe(true)
      client.close()
      expect(rendererVerified).toBe(false)
    } finally {
      client.close()
      await new Promise<void>(resolve => {
        void server.close(() => resolve())
      })
    }
  })
})
