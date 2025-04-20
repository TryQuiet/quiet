import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Chat } from '../Chat.component'
import { ChatProps } from '../Chat.types'
import { FileActionsProps } from '../../UploadedFile/UploadedFile.types'
import { Keyboard, ViewToken } from 'react-native'

jest.useFakeTimers()

// Mock the onViewableItemsChanged callback
const mockOnViewableItemsChanged = jest.fn()

// Mock the FlatList component
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = require('react')
  const { View } = require('react-native')
  const mockFlatList = props => {
    // Save the onViewableItemsChanged callback so we can call it directly in tests
    if (props.onViewableItemsChanged) {
      mockOnViewableItemsChanged.mockImplementation(props.onViewableItemsChanged)
    }

    // Render children directly instead of through FlatList
    return (
      <View testID='mock-flatlist'>
        {props.data?.map((item, index) => (
          <View key={index} testID={`item-${item.displayDate}`}>
            {props.renderItem({ item, index })}
          </View>
        ))}
      </View>
    )
  }
  return mockFlatList
})

describe('Sticky Date Marker Behavior', () => {
  jest
    .spyOn(Keyboard, 'addListener')
    // @ts-expect-error
    .mockImplementation(() => ({ remove: jest.fn() }))

  // Test data with different timestamps for proper chronological ordering
  const testProps: ChatProps & FileActionsProps = {
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
      name: 'general',
      description: '',
      owner: '',
      timestamp: 0,
      id: '',
    },
    pendingMessages: {},
    messages: {
      count: 3,
      groups: {
        '28 Oct': [
          [
            {
              id: '1',
              type: 1,
              message: 'Oldest message',
              // Set this to oldest timestamp (October 28)
              createdAt: 1698483600000, // 2023-10-28T00:00:00.000Z
              date: '28 Oct, 10:00',
              nickname: 'alice',
              isDuplicated: false,
              isRegistered: true,
              pubKey: 'test',
            },
          ],
        ],
        Yesterday: [
          [
            {
              id: '2',
              type: 1,
              message: 'Middle message',
              // Set this to yesterday
              createdAt: 1718717700000, // 2024-06-18T00:15:00.000Z (assuming today is June 19)
              date: '18:15',
              nickname: 'bob',
              isDuplicated: false,
              isRegistered: true,
              pubKey: 'test',
            },
          ],
        ],
        Today: [
          [
            {
              id: '3',
              type: 1,
              message: 'Newest message',
              // Set this to newest timestamp (today)
              createdAt: 1718804100000, // 2024-06-19T00:15:00.000Z
              date: '00:15',
              nickname: 'charlie',
              isDuplicated: false,
              isRegistered: true,
              pubKey: 'test',
            },
          ],
        ],
      },
    },
    updateUploadedFiles: jest.fn(),
    removeFilePreview: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show the oldest date (28 Oct) when scrolled to the top of the list', () => {
    // Render the component
    render(<Chat {...testProps} />)

    // Create ViewToken objects simulating being at the bottom of the list (which is actually
    // where the oldest messages are in the UI due to inverted FlatList)
    // With our display order using reverse(), the newest date is first in the data array
    const viewTokens: ViewToken[] = [
      {
        item: { displayDate: '28 Oct', timestamp: 1698483600000 },
        key: '28 Oct',
        index: 2, // In an inverted list with reverse(), oldest date has the highest index
        isViewable: true,
        section: undefined,
      },
    ]

    // Directly call the onViewableItemsChanged callback
    mockOnViewableItemsChanged({
      viewableItems: viewTokens,
      changed: [],
    })

    // Advance timers to allow animation to complete
    jest.advanceTimersByTime(500)

    // Expect the sticky date marker to show the oldest date (28 Oct)
    const stickyMarker = screen.queryByTestId('StickyDateMarker_28 Oct')
    expect(stickyMarker).toBeTruthy()
  })

  it('should show the current date when only recent messages are visible', () => {
    // Render the component
    render(<Chat {...testProps} />)

    // Create ViewToken objects simulating being at the top of the list
    // In inverted FlatList with reverse(), newest messages are at the top (index 0)
    const viewTokens: ViewToken[] = [
      {
        item: { displayDate: 'Today', timestamp: 1718804100000 },
        key: 'Today',
        index: 0, // In inverted list with reverse(), newest date has the lowest index
        isViewable: true,
        section: undefined,
      },
    ]

    // Directly call the onViewableItemsChanged callback
    mockOnViewableItemsChanged({
      viewableItems: viewTokens,
      changed: [],
    })

    // Advance timers to allow animation to complete
    jest.advanceTimersByTime(500)

    // Expect the sticky date marker to show "Today"
    const stickyMarker = screen.queryByTestId('StickyDateMarker_Today')
    expect(stickyMarker).toBeTruthy()
  })

  it('should show the oldest visible date when multiple date groups are visible', () => {
    // Render the component
    render(<Chat {...testProps} />)

    // Create ViewToken objects simulating being in the middle of the list
    // with multiple date groups visible
    const viewTokens: ViewToken[] = [
      {
        item: { displayDate: 'Yesterday', timestamp: 1718717700000 },
        key: 'Yesterday',
        index: 1, // In our display order, Yesterday is the middle date
        isViewable: true,
        section: undefined,
      },
      {
        item: { displayDate: 'Today', timestamp: 1718804100000 },
        key: 'Today',
        index: 0, // In our display order, Today is the first date
        isViewable: true,
        section: undefined,
      },
    ]

    // Directly call the onViewableItemsChanged callback
    mockOnViewableItemsChanged({
      viewableItems: viewTokens,
      changed: [],
    })

    // Advance timers to allow animation to complete
    jest.advanceTimersByTime(500)

    // Even though Today is first in the list, our findOldestDate function should identify
    // Yesterday as the oldest visible date based on timestamp comparison
    const stickyMarker = screen.queryByTestId('StickyDateMarker_Yesterday')
    expect(stickyMarker).toBeTruthy()
  })
})
