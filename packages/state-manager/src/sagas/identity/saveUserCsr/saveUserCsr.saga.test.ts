import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../identity.slice'
import { saveUserCsrSaga } from './saveUserCsr.saga'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { SocketActionTypes } from '@quiet/types'
import { reducers } from '../../reducers'

describe('saveUserCsr', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('saves user csr', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket

    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const identity = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const reducer = combineReducers(reducers)
    await expectSaga(saveUserCsrSaga, socket)
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emit, [
        SocketActionTypes.SEND_CSR,
        {
          csr: identity.userCsr?.userCsr,
        },
      ])
      .run()
  })
})
