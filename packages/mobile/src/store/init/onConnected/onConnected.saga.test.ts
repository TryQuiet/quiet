import { expectSaga } from 'redux-saga-test-plan'
import { onConnectedSaga } from './onConnected.saga'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { initActions } from '../init.slice'
import { Store } from '../../store.types'

import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { communities, Community, connection, Identity, identity, network, StoreKeys } from '@quiet/state-manager'

describe('onConnectedSaga', () => {
  let store: Store

  const id = '00d045ab'

  const community: Community = {
    id,
    name: '',
    CA: {
      rootCertString: '',
      rootKeyString: '',
    },
    rootCa: '',
    peerList: [],
    registrar: {
      privateKey: '',
      address: '',
    },
    registrarUrl: 'https://bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd.onion',
    onionAddress: '',
    privateKey: '',
    port: 0,
    registrationAttempts: 0,
    ownerCertificate: '',
  }

  const _identity: Partial<Identity> = {
    id,
    nickname: '',
    userCsr: null,
    userCertificate: null,
    joinTimestamp: 0,
  }

  beforeEach(async () => {
    store = (await prepareStore()).store
  })

  test('marks readiness and passes redirection resposibility to another saga if opened from url (quiet://)', async () => {
    store.dispatch(initActions.deepLink('bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'))

    const reducer = combineReducers(reducers)
    await expectSaga(onConnectedSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(initActions.setReady(true))
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
      .run()
  })

  test('redirects to join community screen if there is no user certificate and community is not initialized', async () => {
    const reducer = combineReducers(reducers)

    await expectSaga(onConnectedSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
      .run()
  })

  test('redirects to channel list if user is part of community and community is initialized', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    store.dispatch(network.actions.addInitializedCommunity(community.id))
    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: 'certificate' })
    )

    const reducer = combineReducers(reducers)

    await expectSaga(onConnectedSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(initActions.setReady(true))
      .run()
  })

  test('takes addInitializedCommunties action before replacing screens', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: 'certificate' })
    )

    const reducer = combineReducers(reducers)

    await expectSaga(onConnectedSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .dispatch(network.actions.addInitializedCommunity(community.id))
      .put(initActions.setReady(true))
      .run()
  })
})
