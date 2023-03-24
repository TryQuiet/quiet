import { expectSaga } from 'redux-saga-test-plan'
import { deepLinkSaga } from './deepLink.saga'
import { combineReducers } from '@reduxjs/toolkit'
import { reducers } from '../../root.reducer'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { communities, Community, CommunityOwnership } from '@quiet/state-manager'
import { initActions } from '../init.slice'
import { navigationActions } from '../../navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

describe('deepLinkSaga', () => {
  let store: Store

  const community: Community = {
    id: 'community',
    name: '',
    CA: {
      rootCertString: '',
      rootKeyString: ''
    },
    rootCa: '',
    peerList: [],
    registrar: {
      privateKey: '',
      address: ''
    },
    registrarUrl: 'https://bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd.onion',
    onionAddress: '',
    privateKey: '',
    port: 0,
    registrationAttempts: 0
  }

  beforeEach(() => {
    store = prepareStore().store
  })

  test('joins community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001
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
            code: code
          }
        })
      )
      .put(communities.actions.createNetwork({
        ownership: CommunityOwnership.User,
        registrar: code
      }))
      .run()
  })

  test('opens channel list screen if the same url has been used', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001
      })
    )

    store.dispatch(
      communities.actions.addNewCommunity(community)
    )

    store.dispatch(communities.actions.setCurrentCommunity('community'))

    const code = 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen
        })
      )
      .not.put(communities.actions.createNetwork({
        ownership: CommunityOwnership.User,
        registrar: code
      }))
      .run()
  })

  test('displays error if user already belongs to a community', async () => {
    store.dispatch(
      initActions.setWebsocketConnected({
        dataPort: 5001
      })
    )

    store.dispatch(
      communities.actions.addNewCommunity(community)
    )

    store.dispatch(communities.actions.setCurrentCommunity('community'))

    const code = 'ctbebt3ixybtu4ty2dr3ychjtxpkhuun4neuavkjjhplgzfde5vgelad'

    const reducer = combineReducers(reducers)
    await expectSaga(deepLinkSaga, initActions.deepLink(code))
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(communities.actions.createNetwork({
        ownership: CommunityOwnership.User,
        registrar: code
      }))
      .run()
  })
})
