import { connection, getReduxStoreFactory, socket, Store } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { socketActions, WebsocketConnectionPayload } from '../socket/socket.slice'
import { prepareStore, testReducers } from '../../testUtils/prepareStore'
import { startConnectionSaga } from './socket.saga'

describe('Start Connection Saga', () => {
  const dataPort = 1234
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    store = (await prepareStore()).store
    factory = await getReduxStoreFactory(store)
  })

  it('returns if socketIOSecret is missing', async () => {
    const payload: WebsocketConnectionPayload = {
      dataPort,
      socketIOSecret: undefined,
    } as any
    const spyCall = jest.spyOn(require('typed-redux-saga'), 'call')
    await expectSaga(startConnectionSaga, socketActions.startConnection(payload)).withState(store.getState()).run()
    expect(spyCall).not.toHaveBeenCalledWith(expect.anything(), expect.stringContaining('http://127.0.0.1'))
    spyCall.mockRestore()
  })

  it('connects if socketIOSecret is present', async () => {
    const payload: WebsocketConnectionPayload = {
      dataPort,
      socketIOSecret: 'socketIOSecret',
    }
    await expectSaga(startConnectionSaga, socketActions.startConnection(payload)).withState(store.getState()).run()
  })
})
