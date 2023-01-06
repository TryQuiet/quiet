import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { Store } from '../../store.types'
import { StoreKeys } from '../../store.keys'
import { FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { navigationActions, navigationReducer, NavigationState } from '../navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

import { prepareStore } from '../../../utils/tests/prepareStore'
import { reducers } from '../../root.reducer'

import { redirectionSaga } from './redirection.saga'
import { getFactory, identity } from '@quiet/state-manager'

describe('redirectionSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  test('do nothing if user already sees a splash screen', async () => {
    const currentScreen = ScreenNames.SplashScreen
    await expectSaga(redirectionSaga)
      .withReducer(
        combineReducers({
          [StoreKeys.Navigation]: navigationReducer
        }),
        {
          [StoreKeys.Navigation]: {
            ...new NavigationState(),
            currentScreen
          }
        }
      )
      .not.put(navigationActions.replaceScreen({ screen: currentScreen }))
      .run()
  })

  test('open channel list if user belongs to a community', async () => {
    store.dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ChannelScreen
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

  test('restore previously visited registration step', async () => {
    store.dispatch(
      navigationActions.navigation({
        screen: ScreenNames.UsernameRegistrationScreen
      })
    )

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { userCertificate: null }
    )

    const reducer = combineReducers(reducers)
    await expectSaga(redirectionSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(navigationActions.replaceScreen({ screen: ScreenNames.UsernameRegistrationScreen }))
      .run()
  })
})
