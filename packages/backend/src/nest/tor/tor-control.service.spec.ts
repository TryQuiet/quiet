import { jest } from '@jest/globals'

import { ConfigOptions } from '../types'
import { TorControl } from './tor-control.service'
import { TorControlAuthType, TorControlParams } from './tor.types'

const createTorControl = (authCookie: string) => {
  const torControlParams: TorControlParams = {
    port: 9051,
    host: 'localhost',
    auth: {
      type: TorControlAuthType.COOKIE,
      value: authCookie,
    },
  }
  const torControl = new TorControl(torControlParams, {} as ConfigOptions)
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
  }
  ;(torControl as any).logger = logger
  jest.spyOn(torControl as any, 'connect').mockResolvedValue(undefined)
  return { logger, torControl }
}

describe('TorControl logging', () => {
  it('logs command and response metadata without ADD_ONION private keys', async () => {
    const authCookie = 'auth-cookie-sentinel'
    const requestPrivateKey = 'ED25519-V3:request-private-key-sentinel'
    const responsePrivateKey = 'ED25519-V3:response-private-key-sentinel'
    const { logger, torControl } = createTorControl(authCookie)
    jest.spyOn(torControl, '_sendCommand').mockResolvedValue({
      code: 250,
      messages: ['250-ServiceID=example', `250-PrivateKey=${responsePrivateKey}`, '250 OK'],
    })

    await torControl.sendCommand(`ADD_ONION ${requestPrivateKey} Flags=Detach Port=80,127.0.0.1:3000`)

    const logs = JSON.stringify(logger.debug.mock.calls)
    expect(logger.debug).toHaveBeenCalledWith('Sending Tor command', { command: 'ADD_ONION' })
    expect(logger.debug).toHaveBeenCalledWith('Tor command response', {
      command: 'ADD_ONION',
      code: 250,
      messageCount: 3,
    })
    expect(logs).not.toContain(requestPrivateKey)
    expect(logs).not.toContain(responsePrivateKey)
    expect(logs).not.toContain(authCookie)
  })

  it('does not log an authentication cookie', async () => {
    const authCookie = 'authentication-cookie-sentinel'
    const { logger, torControl } = createTorControl(authCookie)
    jest.spyOn(torControl, '_sendCommand').mockResolvedValue({ code: 250, messages: ['250 OK'] })

    await torControl.sendCommand(`AUTHENTICATE ${authCookie}`)

    expect(logger.debug).toHaveBeenCalledWith('Sending Tor command', { command: 'AUTHENTICATE' })
    expect(JSON.stringify(logger.debug.mock.calls)).not.toContain(authCookie)
  })
})
