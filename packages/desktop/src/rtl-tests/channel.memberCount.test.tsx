import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import MockedSocket from 'socket.io-mock'
import { DateTime } from 'luxon'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import Channel from '../renderer/components/Channel/Channel'
import { getReduxStoreFactory, publicChannels, users } from '@quiet/state-manager'
import { ChannelType, Identity, User, UserProfile } from '@quiet/types'

jest.setTimeout(20_000)

/**
 * #3691: the channel header's member count on a private channel. A private channel has no
 * memberIds — only a DM does — and the header used to fall back to the whole community when
 * memberIds was missing, so a 5-person private channel in a 9-person community read "9 members".
 */
describe('Channel header member count', () => {
  const PRIVATE_ID = 'board'

  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
    window.HTMLElement.prototype.scrollTo = jest.fn()
  })

  // The community from the issue: nine people, five of them (me included) in the private channel.
  const setUp = async () => {
    const { store } = await prepareStore({}, socket)
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community')
    const alice: Identity = await factory.create('Identity', { communityId: community.id, nickname: 'alice' })

    await factory.create('PublicChannel', {
      channel: {
        name: PRIVATE_ID,
        description: 'Board only',
        timestamp: DateTime.utc().valueOf(),
        owner: alice.userId,
        id: PRIVATE_ID,
        public: false,
        type: ChannelType.CHANNEL,
      },
      displayedName: PRIVATE_ID,
    })

    // Private-channel membership reaches the renderer the way the app delivers it: as channelIds on
    // the sigchain users, which the userProfiles selector folds onto each profile as `channels`.
    const others = ['bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan']
    const inPrivate = new Set(['alice', 'bob', 'carol', 'dave', 'erin'])
    const people = ['alice', ...others].map(nickname => ({
      nickname,
      userId: nickname === 'alice' ? alice.userId : `${nickname}-id`,
    }))
    const profiles: UserProfile[] = people.map(({ nickname, userId }) => ({ userId, nickname }))
    const members: User[] = people.map(({ nickname, userId }) => ({
      userId,
      isRegistered: true,
      isDuplicated: false,
      channelIds: inPrivate.has(nickname) ? [PRIVATE_ID] : [],
    }))
    store.dispatch(users.actions.setUserProfiles(profiles))
    store.dispatch(users.actions.setUsers(members))

    const channels = store.getState().PublicChannels.channels.entities
    const generalId = Object.keys(channels).find(id => channels[id]?.name === 'general')
    expect(generalId).toBeDefined()

    renderComponent(<Channel />, store)
    return { store, generalId: generalId as string }
  }

  it('counts only the members of a private channel', async () => {
    const { store, generalId } = await setUp()

    act(() => {
      store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: PRIVATE_ID }))
    })

    expect(await screen.findByTestId('channelMemberCount')).toHaveTextContent('5 members')
  })

  it('still counts the whole community on a public channel', async () => {
    const { store, generalId } = await setUp()

    act(() => {
      store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: generalId }))
    })

    expect(await screen.findByTestId('channelMemberCount')).toHaveTextContent('9 members')
  })

  it('follows a membership change without switching channels', async () => {
    const { store, generalId } = await setUp()

    act(() => {
      store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: PRIVATE_ID }))
    })
    expect(await screen.findByTestId('channelMemberCount')).toHaveTextContent('5 members')

    act(() => {
      store.dispatch(
        users.actions.setUser({ userId: 'frank-id', isRegistered: true, isDuplicated: false, channelIds: [PRIVATE_ID] })
      )
    })

    expect(await screen.findByTestId('channelMemberCount')).toHaveTextContent('6 members')
  })
})
