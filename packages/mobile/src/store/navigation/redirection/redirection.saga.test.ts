import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { FactoryGirl } from 'factory-girl'
import { generateMessageFactoryContentWithId, getFactory, identity, publicChannels } from '@quiet/state-manager'
import { setupCrypto } from '@quiet/identity'
import { navigationActions } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { Store } from '../../store.types'
import { prepareStore } from '../../../tests/utils/prepareStore'
import { reducers } from '../../root.reducer'

import { redirectionSaga } from './redirection.saga'
import { initActions } from '../../init/init.slice'

describe('redirectionSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = (await prepareStore()).store
    factory = await getFactory(store)
  })

  test('does nothing if app opened from url', async () => {
    store.dispatch(initActions.deepLink('bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd'))

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelListScreen,
        })
      )
      .run()
  })

  test("holds until websocket connects if user doesn't belong to a community", async () => {
    const reducer = combineReducers(reducers)

    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        navigationActions.replaceScreen({
          screen: ScreenNames.JoinCommunityScreen,
        })
      )
      .run()
  })

  test('redirect if user sees a splash screen being a member of community', async () => {
    const alice = await factory.create<ReturnType<typeof identity.actions.storeIdentity>['payload']>('Identity')

    const _publicChannels = publicChannels.selectors.publicChannels(store.getState())
    const _generalChannel = _publicChannels.find(c => c.name === 'general')

    const generalChannel = {
      ..._generalChannel,
      // @ts-ignore
      messages: undefined,
      messagesSlice: undefined,
    }

    if (!generalChannel.id) return

    const message = (
      await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>('Message', {
        identity: alice,
        message: generateMessageFactoryContentWithId(generalChannel.id),
        verifyAutomatically: true,
      })
    ).message

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(navigationActions.replaceScreen({ screen: ScreenNames.ChannelListScreen }))
      .run()
  })
})
