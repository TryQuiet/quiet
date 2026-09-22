import React from 'react'
import { TextInput } from 'react-native'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import type { Store } from 'redux'
import { getReduxStoreFactory, messages, network, publicChannels, users } from '@quiet/state-manager'
import { ChannelType, EMPTY_CHANNEL_ID, type UserProfile } from '@quiet/types'
import { generateDmMemberHash } from '@quiet/common'

import { ioMock } from '../../setupTests'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { ChannelScreen } from './Channel.screen'

/**
 * The new-message composer, opened from the Direct messages plus with nobody chosen, while the
 * profile and connection churn that follows every send is still arriving.
 *
 * On a Pixel 10 Pro, choosing yourself and sending worked some of the time. The rest of the time the
 * choice vanished a moment after the tap, the conversation below went blank, the send button stayed
 * lit, and pressing it put a space in the message field and sent nothing. Each profile update (one
 * lands within ~150 ms of every send) rebuilt the candidate list from the recipients the composer
 * was *opened* with — none — and so dropped whatever had been tapped since.
 */
describe('New message composer selection', () => {
  let socket: MockedSocket
  let factory: FactoryGirl

  const ALICE = 'alice-id'
  const SELF_DM = 'self-dm-id'
  const ALICE_DM = 'alice-dm-id'

  const prepare = async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    const { store, root } = await prepareStore({}, socket)
    factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community')
    const identity = await factory.create('Identity', { communityId: community.id })
    const me = await factory.create<UserProfile>('UserProfile', { userId: identity.userId, nickname: 'android' })
    await factory.create('UserProfile', { userId: ALICE, nickname: 'alice' })

    const dm = (id: string, memberIds: string[]) =>
      factory.create('PublicChannel', {
        channel: {
          id,
          name: 'Direct message',
          description: 'Direct message',
          owner: identity.userId,
          timestamp: 0,
          public: false,
          type: ChannelType.DM,
          teamId: community.teamId,
          memberIds,
          memberIdHash: generateDmMemberHash(memberIds),
        },
      })
    // A self-DM holds just its one member.
    await dm(SELF_DM, [identity.userId])
    await dm(ALICE_DM, [identity.userId, ALICE])

    // What the Direct messages plus dispatches: the composer, nobody chosen yet.
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: '' }))
    store.dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true }))

    return { store, root, me }
  }

  // Row testIDs carry the composer's current channel id, which follows the selection.
  const row = (userId: string) => screen.getByTestId(new RegExp(`^update-channel-membership-list-row-.*-${userId}$`))
  const pill = (userId: string) => screen.queryByTestId(`new-message-recipient-pill-${userId}`)
  const messageField = () => within(screen.getByTestId('message-composer')).getByTestId('input')
  const currentChannelId = (store: { getState: () => unknown }) =>
    publicChannels.selectors.currentChannelId(store.getState() as never)

  // Exactly what arrives right after a send: the profiles replicated back (`updateUserProfiles`
  // ends in `setUserProfile` per profile), then a peer's connection state.
  const profileChurn = async (store: Store, me: UserProfile) => {
    await act(async () => {
      store.dispatch(users.actions.setUserProfile({ ...me }))
      store.dispatch(users.actions.setUserProfile({ userId: ALICE, nickname: 'alice' } as UserProfile))
      store.dispatch(network.actions.addConnectedPeers(['a-peer']))
      store.dispatch(network.actions.removeConnectedPeer(['a-peer']))
    })
  }

  it('finds the existing self-DM when you choose yourself, and keeps it through profile updates', async () => {
    const { store, root, me } = await prepare()
    // Before rendering: the screen's callbacks hold on to the dispatch they were given.
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<ChannelScreen />, store)

    fireEvent.press(row(me.userId))
    await waitFor(() => expect(currentChannelId(store)).toEqual(SELF_DM))
    expect(pill(me.userId)).toBeTruthy()

    await profileChurn(store, me)

    expect(pill(me.userId)).toBeTruthy()
    expect(currentChannelId(store)).toEqual(SELF_DM)

    // And sending goes to that conversation rather than creating another.
    fireEvent.changeText(messageField(), 'note to self')
    fireEvent.press(screen.getByTestId('send_message_button'))
    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(
        messages.actions.sendMessage({ channelId: SELF_DM, message: 'note to self' })
      )
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'PublicChannels/createChannel' }))

    root?.cancel()
  })

  it('never deselects a chosen recipient when profiles or connections update', async () => {
    const { store, root, me } = await prepare()
    renderComponent(<ChannelScreen />, store)

    fireEvent.press(row(ALICE))
    await waitFor(() => expect(currentChannelId(store)).toEqual(ALICE_DM))
    fireEvent.press(row(me.userId))
    // Alice and me together: the alice DM (a DM always includes me).
    await waitFor(() => expect(pill(me.userId)).toBeTruthy())

    await profileChurn(store, me)
    await profileChurn(store, me)

    expect(pill(ALICE)).toBeTruthy()
    expect(pill(me.userId)).toBeTruthy()
    expect(currentChannelId(store)).toEqual(ALICE_DM)

    root?.cancel()
  })

  it('keeps a recipient whose profile is missing for a moment', async () => {
    const { store, root, me } = await prepare()
    renderComponent(<ChannelScreen />, store)

    fireEvent.press(row(ALICE))
    await waitFor(() => expect(currentChannelId(store)).toEqual(ALICE_DM))

    // `setUserProfiles` replaces the whole map; a snapshot that has not got alice yet.
    await act(async () => {
      store.dispatch(users.actions.setUserProfiles([me]))
    })
    expect(pill(ALICE)).toBeTruthy()
    expect(currentChannelId(store)).toEqual(ALICE_DM)

    await act(async () => {
      store.dispatch(users.actions.setUserProfiles([me, { userId: ALICE, nickname: 'alice' } as UserProfile]))
    })
    expect(pill(ALICE)).toBeTruthy()
    expect(currentChannelId(store)).toEqual(ALICE_DM)

    root?.cancel()
  })

  it('still starts from the recipients it was opened with', async () => {
    const { store, root } = await prepare()
    await act(async () => {
      store.dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true, recipientIds: [ALICE] }))
    })
    renderComponent(<ChannelScreen />, store)

    await waitFor(() => expect(pill(ALICE)).toBeTruthy())
    // Taking the seeded recipient off is the user's choice, and a rebuild must not put them back.
    fireEvent.press(row(ALICE))
    await waitFor(() => expect(pill(ALICE)).toBeNull())
    await act(async () => {
      store.dispatch(users.actions.setUserProfile({ userId: ALICE, nickname: 'alice' } as UserProfile))
    })
    expect(pill(ALICE)).toBeNull()

    root?.cancel()
  })

  it('cannot send with nobody chosen, and a refused press leaves the message untouched', async () => {
    const { store, root } = await prepare()
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    renderComponent(<ChannelScreen />, store)
    jest.useFakeTimers()
    // The send path writes the autocorrect-commit space straight to the native view, so watch there.
    // react-native's jest preset already mocks these, shared by every instance, hence the clears.
    const nativeWrites = jest.spyOn(TextInput.prototype, 'setNativeProps')
    const nativeClears = jest.spyOn(TextInput.prototype, 'clear')

    fireEvent.changeText(messageField(), 'hello')
    nativeWrites.mockClear()
    nativeClears.mockClear()
    fireEvent.press(screen.getByTestId('send_message_button'))
    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    expect(nativeWrites).not.toHaveBeenCalled()
    expect(nativeClears).not.toHaveBeenCalled()
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: messages.actions.sendMessage.type }))
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'PublicChannels/createChannel' }))
    expect(currentChannelId(store)).toEqual(EMPTY_CHANNEL_ID)

    // Choosing somebody is what enables it.
    fireEvent.press(row(ALICE))
    await act(async () => {
      jest.advanceTimersByTime(0)
    })
    fireEvent.press(screen.getByTestId('send_message_button'))
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    expect(dispatchSpy).toHaveBeenCalledWith(messages.actions.sendMessage({ channelId: ALICE_DM, message: 'hello' }))

    jest.useRealTimers()
    root?.cancel()
  })
})
