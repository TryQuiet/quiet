import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { Store } from '../../store.types'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { communities, Community, connection, identity } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { deepLinkSaga } from './deepLink.saga'
import { CommunityOwnership, ConnectionProcessInfo, Identity } from '@quiet/types'

describe('deepLinkSaga', () => {
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

  test('joins community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    const code = 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
          params: {
            code,
          },
        })
      )
      .put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          registrar: code,
        })
      )
      .run()
  })

  test('opens channel list screen if the same url has been used', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: 'certificate' })
    )

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const code = 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          registrar: code,
        })
      )
      .run()
  })

  test('displays error if user already belongs to a community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const code = 'ctbebt3ixybtu4ty2dr3ychjtxpkhuun4neuavkjjhplgzfde5vgelad'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          registrar: code,
        })
      )
      .run()
  })

  test('continues if link used mid registration', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: null })
    )

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const code = 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.UsernameRegistrationScreen,
          params: undefined,
        })
      )
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          registrar: code,
        })
      )
      .run()
  })

  test('continues if link used mid registration and locks input while waiting for server response', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001,
      })
    )

    store.dispatch(communities.actions.addNewCommunity(community))

    store.dispatch(
      // @ts-expect-error
      identity.actions.addNewIdentity({ ..._identity, userCertificate: null })
    )

    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    store.dispatch(connection.actions.setTorConnectionProcess(ConnectionProcessInfo.REGISTERING_USER_CERTIFICATE))

    const code = 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.UsernameRegistrationScreen,
          params: { fetching: true },
        })
      )
      .not.put(
        communities.actions.createNetwork({
          ownership: CommunityOwnership.User,
          registrar: code,
        })
      )
      .run()
  })
})
