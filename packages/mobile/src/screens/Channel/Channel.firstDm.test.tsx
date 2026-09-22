import React from 'react'
import '@testing-library/jest-native/extend-expect'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native'
import MockedSocket from 'socket.io-mock'
import { FactoryGirl } from 'factory-girl'
import { getReduxStoreFactory, publicChannels } from '@quiet/state-manager'
import {
  ChannelOperationStatus,
  ChannelType,
  type CreateChannelPayload,
  EMPTY_CHANNEL_ID,
  SocketActions,
} from '@quiet/types'
import { generateDmMemberHash } from '@quiet/common'

import { ioMock } from '../../setupTests'
import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { ChannelScreen } from './Channel.screen'

/**
 * Sending the first message of a new DM, from the composer that Community home's person row opens
 * (AppHome's `openMember`).
 *
 * On a Pixel 10 Pro this white-screened the app: the conversation was created and the message
 * delivered, and then the screen went blank and stayed blank until the app was restarted. The store
 * it left behind was `currentChannelId: '-1'` with `newMessageOpen: false` — nothing being composed
 * and no channel current, the one state this screen used to render as nothing at all.
 *
 * It got there because the composer keeps the current channel in step with its recipient selection,
 * and that sync ran once more after the backend had answered, overwriting the new channel id with
 * the empty sentinel. It was a race, so it only bit when the backend answered quickly.
 */
describe('Sending the first message of a new DM', () => {
  let socket: MockedSocket
  let factory: FactoryGirl

  const ALICE = 'alice-id'
  const CREATED_DM = 'new-dm-channel-id'

  const prepare = async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    const { store, root } = await prepareStore({}, socket)
    factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community')
    const identity = await factory.create('Identity', { communityId: community.id })
    await factory.create('UserProfile', { userId: identity.userId, nickname: 'me' })
    await factory.create('UserProfile', { userId: ALICE, nickname: 'alice' })

    const answerCreateChannel = jest.fn(async (event: string, payload: CreateChannelPayload) => {
      if (event !== SocketActions.CREATE_CHANNEL) return undefined
      const memberIds = payload.memberIds ?? []
      return {
        status: ChannelOperationStatus.SUCCESS,
        channel: {
          id: CREATED_DM,
          name: 'Direct message',
          description: 'Direct message',
          owner: identity.userId,
          timestamp: Date.now(),
          public: false,
          type: ChannelType.DM,
          teamId: payload.teamId,
          memberIds,
          memberIdHash: generateDmMemberHash(memberIds),
        },
      }
    })
    Object.assign(socket, { emitWithAck: answerCreateChannel })

    // Exactly what Community home's person row dispatches for someone you have no DM with.
    store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: '' }))
    store.dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true, recipientIds: [ALICE] }))

    return { store, root, identity }
  }

  // The composer's message field shares its testID with the recipient field above it, so reach it
  // through the block that holds it.
  const sendFirstMessage = (text: string) => {
    fireEvent.changeText(within(screen.getByTestId('message-composer')).getByTestId('input'), text)
    fireEvent.press(screen.getByTestId('send_message_button'))
  }

  const currentChannelId = (store: { getState: () => unknown }) =>
    publicChannels.selectors.currentChannelId(store.getState() as never)

  it('opens the created conversation and keeps drawing the chat', async () => {
    const { store, root } = await prepare()
    renderComponent(<ChannelScreen />, store)

    sendFirstMessage('first message')

    await waitFor(() => expect(currentChannelId(store)).toEqual(CREATED_DM))
    expect(screen.getByTestId('chat-composer-controls')).toBeTruthy()
    expect(screen.getByTestId('chat-appbar-title')).toBeTruthy()

    root?.cancel()
  })

  /**
   * The bug itself. The selection sync is handed to the composer as a prop, so a copy taken while
   * the composer was open can still be invoked afterwards — which is what the candidate list's
   * rebuild-on-connection-change did on the device. It must no longer touch the channel.
   */
  it('ignores a recipient sync that arrives after the conversation was created', async () => {
    const { store, root } = await prepare()
    renderComponent(<ChannelScreen />, store)

    // The copy the open composer was holding, before anything is sent.
    const composer = screen.UNSAFE_root.findAll(node => node.props?.setDmChannelOnSelection != null)[0]
    const staleSync = composer.props.setDmChannelOnSelection as (ids: string[]) => void

    sendFirstMessage('first message')
    await waitFor(() => expect(currentChannelId(store)).toEqual(CREATED_DM))

    act(() => staleSync([]))
    act(() => staleSync([ALICE]))

    expect(currentChannelId(store)).toEqual(CREATED_DM)
    expect(screen.getByTestId('chat-composer-controls')).toBeTruthy()

    root?.cancel()
  })

  /**
   * The safety net. However the store gets there, "nothing being composed and no channel current"
   * must not be a blank screen the user cannot leave.
   */
  it('returns to the community home rather than drawing nothing', async () => {
    const { store, root } = await prepare()
    renderComponent(<ChannelScreen />, store)
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    await act(async () => {
      store.dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
      store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: EMPTY_CHANNEL_ID }))
    })

    await waitFor(() =>
      expect(dispatchSpy).toHaveBeenCalledWith(navigationActions.navigation({ screen: ScreenNames.AppHomeScreen }))
    )

    root?.cancel()
  })
})
