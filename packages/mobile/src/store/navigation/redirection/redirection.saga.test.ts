import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { Store } from '../../store.types'
import { StoreKeys } from '../../store.keys'
import { FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { navigationActions, navigationReducer, NavigationState } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { prepareStore } from '../../../tests/utils/prepareStore'
import { reducers } from '../../root.reducer'

import { redirectionSaga } from './redirection.saga'
import { getFactory, identity } from '@quiet/state-manager'
import { initActions, initReducer, InitState } from '../../init/init.slice'

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

  test('does nothing if user already sees a splash screen', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(navigationActions.replaceScreen({ screen: ScreenNames.SplashScreen }))
      .run()
  })

  test('opens channel list if user belongs to a community', async () => {
    store.dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ChannelScreen,
      })
    )

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity')

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(navigationActions.replaceScreen({ screen: ScreenNames.ChannelListScreen }))
      .run()
  })

  test('restores previously visited registration step', async () => {
    store.dispatch(
      navigationActions.navigation({
        screen: ScreenNames.UsernameRegistrationScreen,
      })
    )

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      userCertificate: null,
    })

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(navigationActions.replaceScreen({ screen: ScreenNames.UsernameRegistrationScreen }))
      .run()
  })
})
