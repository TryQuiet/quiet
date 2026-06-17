import React from 'react'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { Chat } from '../Chat.component'
import { Keyboard } from 'react-native'
import { ChatProps, ListItem } from '../Chat.types'
import { FileActionsProps } from '../../FileAttachment/FileAttachment.types'
import { ChannelType, DisplayableMessage } from '@quiet/types'

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock components
jest.mock('../../Appbar/Appbar.component', () => {
  const mockReact = require('react')
  const mockRN = require('react-native')
  return {
    Appbar: () => mockReact.createElement(mockRN.View, { testID: 'mock-appbar' }),
  }
})

jest.mock('../../Message/Message.component', () => {
  const mockReact = require('react')
  const mockRN = require('react-native')
  return {
    Message: (props: { data: DisplayableMessage[] }) =>
      mockReact.createElement(mockRN.View, { testID: `message-${props.data[0].id}` }, props.data[0].message),
  }
})

jest.mock('../../MessagesDivider/MessagesDivider.component', () => {
  const mockReact = require('react')
  const mockRN = require('react-native')
  return {
    MessagesDivider: (props: { title?: string; timestamp?: number; isSticky?: boolean }) =>
      mockReact.createElement(
        mockRN.View,
        {
          testID: `divider-${props.title || (props.timestamp ? 'timestamp' : 'unknown')}`,
          'data-is-sticky': props.isSticky,
        },
        props.title || (props.timestamp ? 'formatted-date' : 'unknown')
      ),
  }
})

jest.useFakeTimers()

describe('Chat component list data', () => {
  jest
    .spyOn(Keyboard, 'addListener')
    // @ts-expect-error
    .mockImplementation(() => ({ remove: jest.fn() }))

  // Create mock messages with timestamps spanning different days
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(today.getDate() - 2)

  // Format dates to match expected format in the component
  const formatDateKey = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const todayKey = 'Today'
  const yesterdayKey = 'Yesterday'
  const twoDaysAgoKey = formatDateKey(twoDaysAgo)

  // Convert dates to Unix timestamps
  const todayTimestamp = Math.floor(today.getTime() / 1000)
  const yesterdayTimestamp = Math.floor(yesterday.getTime() / 1000)
  const twoDaysAgoTimestamp = Math.floor(twoDaysAgo.getTime() / 1000)

  const mockMessages = {
    count: 6,
    groups: {
      [todayKey]: [
        [
          {
            id: '1',
            type: 1,
            message: 'Today message 1',
            createdAt: todayTimestamp,
            date: '12:00',
            nickname: 'user1',
            isDuplicated: false,
            isRegistered: true,
            pubkey: 'key1',
            userId: 'user1-id',
          },
          {
            id: '2',
            type: 1,
            message: 'Today message 2',
            createdAt: todayTimestamp + 60,
            date: '12:01',
            nickname: 'user1',
            isDuplicated: false,
            isRegistered: true,
            pubkey: 'key1',
            userId: 'user1-id',
          },
        ],
      ],
      [yesterdayKey]: [
        [
          {
            id: '3',
            type: 1,
            message: 'Yesterday message',
            createdAt: yesterdayTimestamp,
            date: '15:30',
            nickname: 'user2',
            isDuplicated: false,
            isRegistered: true,
            pubkey: 'key2',
            userId: 'user2-id',
          },
        ],
      ],
      [twoDaysAgoKey]: [
        [
          {
            id: '4',
            type: 1,
            message: 'Two days ago message 1',
            createdAt: twoDaysAgoTimestamp,
            date: '09:15',
            nickname: 'user3',
            isDuplicated: false,
            isRegistered: true,
            pubkey: 'key3',
            userId: 'user3-id',
          },
        ],
        [
          {
            id: '5',
            type: 1,
            message: 'Two days ago message 2',
            createdAt: twoDaysAgoTimestamp + 3600,
            date: '10:15',
            nickname: 'user3',
            isDuplicated: false,
            isRegistered: true,
            pubkey: 'key3',
            userId: 'user3-id',
          },
        ],
      ],
    },
  }

  const props: ChatProps & FileActionsProps = {
    contextMenu: {
      visible: false,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
    },
    sendMessageAction: jest.fn(),
    loadMessagesAction: jest.fn(),
    handleBackButton: jest.fn(),
    openImagePreview: jest.fn(),
    duplicatedUsernameHandleBack: jest.fn(),
    unregisteredUsernameHandleBack: jest.fn(),
    openUrl: jest.fn(),
    downloadFile: jest.fn(),
    cancelDownload: jest.fn(),
    channel: {
      name: 'test-channel',
      description: '',
      owner: '',
      timestamp: 0,
      id: '',
      public: true,
      type: ChannelType.CHANNEL,
      teamId: 'foobar',
    },
    connectedPeers: [],
    channelName: 'test-channel',
    newChat: false,
    userProfiles: {},
    pendingMessages: {},
    messages: mockMessages,
    updateFileAttachments: jest.fn(),
    updateImageAttachments: jest.fn(),
    removeFilePreview: jest.fn(),
    createOrSetDmChannelAction: jest.fn(),
    setDmChannelOnSelection: jest.fn(),
  }

  it('renders the correct number of messages and dividers', () => {
    const { getAllByTestId } = renderComponent(<Chat {...props} />)

    // Check for dividers (one for each date group)
    const dividers = [
      ...getAllByTestId(/^divider-Today$/),
      ...getAllByTestId(/^divider-Yesterday$/),
      ...getAllByTestId(new RegExp(`^divider-${twoDaysAgoKey}$`)),
    ]

    expect(dividers.length).toBe(3)

    // Check for messages (total count should match the sum of all messages)
    const totalMessageGroups = Object.values(mockMessages.groups).flat().length
    const messages = getAllByTestId(/^message-\d+$/)
    expect(messages.length).toBe(totalMessageGroups)
  })

  it('verifies correct chronological order of date dividers in inverted list', () => {
    const { getAllByTestId } = renderComponent(<Chat {...props} />)

    // Get all elements in the order they appear
    const allElements = getAllByTestId(/^(divider|message)/, { exact: false })
    const testIds = allElements.map(el => el.props.testID)

    // Log the actual order to debug
    console.log('Actual testIDs order:', testIds)

    // Find indices for date dividers
    const todayDividerIndex = testIds.indexOf('divider-Today')
    const yesterdayDividerIndex = testIds.indexOf('divider-Yesterday')
    const twoDaysAgoDividerIndex = testIds.indexOf(`divider-${twoDaysAgoKey}`)

    // Verify dividers exist
    expect(todayDividerIndex).not.toBe(-1)
    expect(yesterdayDividerIndex).not.toBe(-1)
    expect(twoDaysAgoDividerIndex).not.toBe(-1)

    // The FlatList is inverted, so the order in the DOM is actually the opposite of what we expect visually
    // The oldest content (two days ago) appears first in the DOM, and newest (today) appears last
    expect(twoDaysAgoDividerIndex).toBeLessThan(yesterdayDividerIndex)
    expect(yesterdayDividerIndex).toBeLessThan(todayDividerIndex)
  })

  it('verifies correct order of messages within date groups', () => {
    const { getAllByTestId } = renderComponent(<Chat {...props} />)

    // Get all elements in the order they appear
    const allElements = getAllByTestId(/^(divider|message)/, { exact: false })
    const testIds = allElements.map(el => el.props.testID)

    // For two days ago messages (should be message-5 before message-4 in the inverted list)
    const message5Index = testIds.indexOf('message-5')
    const message4Index = testIds.indexOf('message-4')
    expect(message5Index).toBeLessThan(message4Index)

    // Verify divider appears after its related messages (in the inverted list)
    const twoDaysAgoDividerIndex = testIds.indexOf(`divider-${twoDaysAgoKey}`)
    expect(message4Index).toBeLessThan(twoDaysAgoDividerIndex)

    // Also check for Today's divider
    const message1Index = testIds.indexOf('message-1')
    const todayDividerIndex = testIds.indexOf('divider-Today')
    expect(message1Index).toBeLessThan(todayDividerIndex)
  })

  it('loads more messages when scrolling to the end', () => {
    const { getByTestId } = renderComponent(<Chat {...props} />)

    // Find the component with the chat testID
    const chatComponent = getByTestId(`chat_${props.channel?.name}`)

    // Get all child components
    const flatListComponent = chatComponent.findAllByType(require('react-native').FlatList)[0]

    // Simulate onEndReached
    flatListComponent.props.onEndReached()

    // Verify loadMessagesAction was called with the correct argument
    expect(props.loadMessagesAction).toHaveBeenCalledWith(true)
  })
})
