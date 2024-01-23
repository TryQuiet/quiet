import { connection, getFactory, Store } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { socketActions, WebsocketConnectionPayload } from '../socket/socket.slice'
import { prepareStore } from '../../testUtils/prepareStore'
import { startConnectionSaga } from './socket.saga'

describe('Start Connection Saga', () => {
  const dataPort = 1234
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    store = (await prepareStore()).store
    factory = await getFactory(store)
  })

  it('socketIOSecret is null - take setSocketIOSecret', async () => {
    const payload: WebsocketConnectionPayload = {
      dataPort,
    }

    await expectSaga(startConnectionSaga, socketActions.startConnection(payload))
      .withState(store.getState())
      .take(connection.actions.setSocketIOSecret)
      .run()
  })

  it('socketIOSecret already exist', async () => {
    const payload: WebsocketConnectionPayload = {
      dataPort,
    }

    store.dispatch(connection.actions.setSocketIOSecret('secret'))

    await expectSaga(startConnectionSaga, socketActions.startConnection(payload))
      .withState(store.getState())
      .not.take(connection.actions.setSocketIOSecret)
      .run()
  })
})
