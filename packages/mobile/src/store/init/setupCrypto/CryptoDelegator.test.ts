import MockedSocket from 'socket.io-mock'

import { ioMock } from '../../../setupTests'

import { CryptoDelegator } from './CryptoDelegator'
import { SocketActionTypes } from '@quiet/state-manager'

describe('CryptoDelegator', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('returns valid subtle', async () => {
    const delegator = new CryptoDelegator(socket)
    const methods = Object.keys(delegator.subtle)
    expect(methods.length).toBeGreaterThan(0)
  })

  it('reacts on response from crypto service', async () => {
    const delegator = new CryptoDelegator(socket)

    let resolve: (value: any) => void
    let reject: (reason: any) => void

    // eslint-disable-next-line
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })

    delegator.calls.set('uuid', { resolve, reject })

    delegator.respond({
      id: 'uuid',
      value: 'data'
    })

    const response = await promise
    expect(response).toEqual('data')
  })

  it('makes calls to nodejs crypto', async () => {
    const delegator = new CryptoDelegator(socket)

    const spy = jest.spyOn(socket, 'emit')

    // eslint-disable-next-line
    delegator.call('encrypt', ['sha256', 'data'])

    expect(spy).toHaveBeenCalledWith(SocketActionTypes.CRYPTO_SERVICE_CALL, {
      id: expect.any(String),
      args: ['sha256', 'data'],
      method: 'encrypt'
    })
  })
})
