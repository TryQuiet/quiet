import { expectSaga } from 'redux-saga-test-plan'
import { SocketActions } from '@quiet/types'
import { applyEmitParams, type Socket } from '../../../types'
import { communitiesActions } from '../communities.slice'
import { debugAddServerSaga } from './debugAddServer.saga'

describe('debugAddServerSaga', () => {
  it('emits a debug server request to the backend', async () => {
    const payload = {
      serverHosts: ['unknown-server.example.com'],
    }
    const socket = { emit: jest.fn() } as unknown as Socket

    await expectSaga(debugAddServerSaga, socket, communitiesActions.debugAddServer(payload))
      .apply(socket, socket.emit, applyEmitParams(SocketActions.DEBUG_ADD_SERVER, payload))
      .run()
  })
})
