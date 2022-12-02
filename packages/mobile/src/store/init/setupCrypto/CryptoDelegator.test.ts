import MockedSocket from 'socket.io-mock'

import { ioMock } from '../../../setupTests'

import { CryptoDelegator } from './CryptoDelegator'
import { CryptoServicePayload, SocketActionTypes } from '@quiet/state-manager'

describe('CryptoDelegator', () => {
    let socket: MockedSocket

    beforeEach(() => {
        socket = new MockedSocket()
        ioMock.mockImplementation(() => socket)
    })

    it('returns valid subtle', async () => {
        const delegator = new CryptoDelegator(socket)
        expect(delegator.subtle).not.toBe({}) // TODO: We need more strict assertion
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

        // eslint-disable-next-line
        expect(promise).resolves // TODO: We need to check if promise resolves with proper data
    })

    it('makes calls to nodejs crypto', async () => {
        const delegator = new CryptoDelegator(socket)

        jest
            .spyOn(socket, 'emit')
            .mockImplementation(async (action: SocketActionTypes, payload: CryptoServicePayload) => {
                expect(action).toBe(SocketActionTypes.CRYPTO_SERVICE_CALL)
                return socket.socketClient.emit(SocketActionTypes.CRYPTO_SERVICE_RESPONSE, {
                    id: payload.id,
                    value: 'encrypted_data'
                })
            })

        const call = delegator.call('encrypt', ['sha256', 'data'])

        // eslint-disable-next-line
        expect(call).resolves // TODO: We need to check if promise resolves with proper data
    })
})
