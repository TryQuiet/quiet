import React from 'react'
import '@testing-library/jest-native/extend-expect'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../setupTests'
import { prepareStore } from './utils/prepareStore'
import { renderComponent } from './utils/renderComponent'
import { FactoryGirl } from 'factory-girl'
import { getFactory, communities, identity, users } from '@quiet/state-manager'
import { ScreenNames } from '../const/ScreenNames.enum'
import { initActions } from '../store/init/init.slice'
import { ChannelListScreen } from '../screens/ChannelList/ChannelList.screen'
import { navigationSelectors } from '../store/navigation/navigation.selectors'
import { navigationActions } from '../store/navigation/navigation.slice'

describe.skip('Duplicate username warning', () => {
  let socket: MockedSocket

  let factory: FactoryGirl

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it("Display prompt for username change if it's already taken", async () => {
    const { store, root } = await prepareStore({}, socket)

    store.dispatch(initActions.setStoreReady())

    factory = await getFactory(store)

    const community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>(
      'Community'
    )

    const alice = (
      await factory.build<typeof identity.actions.addNewIdentity>('Identity', {
        id: community.id,
        nickname: 'alice',
      })
    ).payload

    store.dispatch(
      users.actions.storeUserCertificate({
        certificate: alice.userCertificate || 'certificate_alice',
      })
    )

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
      userCertificate: null,
    })

    store.dispatch(navigationActions.navigation({ screen: ScreenNames.ChannelListScreen }))

    renderComponent(<ChannelListScreen />, store)

    // Confirm there's duplication of usernames
    const usernameTaken = identity.selectors.usernameTaken(store.getState())
    expect(usernameTaken).toBe(true)

    const currentScreen = navigationSelectors.currentScreen(store.getState())
    expect(currentScreen).toBe(ScreenNames.UsernameTakenScreen)

    root?.cancel()
  })
})
