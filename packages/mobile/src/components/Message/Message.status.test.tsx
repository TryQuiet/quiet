import React from 'react'
import { within } from '@testing-library/react-native'
import { messages } from '@quiet/state-manager'
import { DisplayableMessage, MessageType, SendingStatus } from '@quiet/types'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'

jest.unmock('@ronradtke/react-native-markdown-display')

it('identifies each message as pending until its stored acknowledgment, independently of its group', () => {
  const stored: DisplayableMessage & { channelId: string } = {
    id: 'stored',
    channelId: 'general',
    type: MessageType.Basic,
    message: 'Earlier stored message',
    createdAt: 1,
    date: 'Today',
    nickname: 'nativeowner',
    userId: 'owner',
    isDuplicated: false,
    isRegistered: true,
  }
  const pending = { ...stored, id: 'pending', message: 'New message awaiting storage', createdAt: 2 }
  let state = messages.reducer(
    undefined,
    messages.actions.addMessagesSendingStatus({ message: pending, status: SendingStatus.Pending })
  )
  const props = {
    data: [stored, pending],
    openUrl: jest.fn(),
    openImagePreview: jest.fn(),
    downloadFile: jest.fn(),
    cancelDownload: jest.fn(),
    duplicatedUsernameHandleBack: jest.fn(),
    unregisteredUsernameHandleBack: jest.fn(),
  }
  const screen = renderComponent(<Message {...props} pendingMessages={state.messageSendingStatus.entities} />)

  expect(within(screen.getByTestId('userMessages-nativeowner')).getByTestId(stored.message)).toBeTruthy()
  expect(within(screen.getByTestId('userMessages-nativeowner')).getByTestId(pending.message)).toBeTruthy()
  expect(within(screen.getByTestId('message-stored')).getByTestId(stored.message)).toBeTruthy()
  expect(within(screen.getByTestId('message-stored')).queryByTestId(pending.message)).toBeNull()
  expect(within(screen.getByTestId('message-pending')).getByTestId(pending.message)).toBeTruthy()

  // The socket MESSAGES_STORED handler dispatches this action after the backend
  // acknowledges storage. Rerender with the real reducer's resulting state.
  state = messages.reducer(state, messages.actions.removePendingMessageStatuses({ messages: [pending] }))
  screen.rerender(<Message {...props} pendingMessages={state.messageSendingStatus.entities} />)

  expect(screen.queryByTestId('message-pending')).toBeNull()
  expect(screen.getAllByTestId('message-stored')).toHaveLength(2)
})
