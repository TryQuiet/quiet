import React from 'react'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { Chat } from '../Chat.component'
import { Keyboard } from 'react-native'
import { ChatProps } from '../Chat.types'
import { FileActionsProps } from '../../FileAttachment/FileAttachment.types'
import { ChannelType } from '@quiet/types'

jest.useFakeTimers()

describe('Chat component', () => {
  jest
    .spyOn(Keyboard, 'addListener')
    // @ts-expect-error
    .mockImplementation(() => ({ remove: jest.fn() }))

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
    createOrSetDmChannelAction: jest.fn(),
    openUrl: jest.fn(),
    downloadFile: jest.fn(),
    cancelDownload: jest.fn(),
    channel: {
      name: 'general',
      description: '',
      owner: '',
      timestamp: 0,
      id: '',
      public: true,
      type: ChannelType.CHANNEL,
      teamId: 'foobar',
    },
    channelName: 'general',
    newChat: false,
    userProfiles: {},
    connectedPeers: [],
    pendingMessages: {},
    messages: {
      count: 16,
      groups: {
        '28 Oct': [
          [
            {
              id: '1',
              type: 1,
              message: 'Hello',
              createdAt: 1698483600, // Oct 28, 2023, 9:00 AM UTC
              date: '28 Oct, 10:00',
              nickname: 'alice',
              userId: 'aliceUserId',
              isDuplicated: false,
              isRegistered: true,
            },
            {
              id: '2',
              type: 1,
              message:
                "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
              createdAt: 1698483660, // Oct 28, 2023, 9:00 AM UTC
              date: '28 Oct, 10:01',
              nickname: 'alice',
              userId: 'aliceUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '3',
              type: 1,
              message: 'Great, thanks!',
              createdAt: 1698483720, // Oct 28, 2023, 9:02 AM UTC
              date: '28 Oct, 10:02',
              nickname: 'john',
              userId: 'johnUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
        ],
        Today: [
          [
            {
              id: '4',
              type: 1,
              message: 'Luck, I am your father!',
              createdAt: 1714485600, // Apr 30, 2024, 2:00 PM UTC (same day as test)
              date: '12:40',
              nickname: 'chad',
              userId: 'chadUserId',
              isDuplicated: false,
              isRegistered: true,
            },
            {
              id: '5',
              type: 1,
              message: "That's impossible!",
              createdAt: 1714485660, // Apr 30, 2024, 2:06 PM UTC
              date: '12:41',
              nickname: 'chad',
              userId: 'chadUserId',
              isDuplicated: false,
              isRegistered: true,
            },
            {
              id: '6',
              type: 1,
              message: 'Nooo!',
              createdAt: 1714485900, // Apr 30, 2024, 2:06 PM UTC
              date: '12:45',
              nickname: 'chad',
              userId: 'chadUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '7',
              type: 1,
              message: 'Uhuhu!',
              createdAt: 1714485960, // Apr 30, 2024, 2:06 PM UTC
              date: '12:46',
              nickname: 'anakin',
              userId: 'anakinUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '8',
              type: 1,
              message: 'Why?',
              createdAt: 1714485970, // Apr 30, 2024, 2:06 PM UTC
              date: '12:46',
              nickname: 'anakin',
              userId: 'anakinUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '9',
              type: 1,
              message: 'Messages more there should be',
              createdAt: 1714485980, // Apr 30, 2024, 2:06 PM UTC
              date: '12:46',
              nickname: 'yoda',
              userId: 'yodaUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '11',
              type: 1,
              message: 'I Agree',
              createdAt: 1714485990, // Apr 30, 2024, 2:06 PM UTC
              date: '12:46',
              nickname: 'obi',
              userId: 'obiUserId',
              isDuplicated: false,
              isRegistered: true,
            },
            {
              id: '12',
              type: 1,
              message: 'Of course, I Agree',
              createdAt: 1714486000, // Apr 30, 2024, 2:06 PM UTC
              date: '12:46',
              nickname: 'obi',
              userId: 'obiUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '13',
              type: 1,
              message: 'Wrough!',
              createdAt: 1714486010, // Apr 30, 2024, 2:07 PM UTC
              date: '12:46',
              nickname: 'wookie',
              userId: 'wookieUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '14',
              type: 1,
              message: 'Yeah!',
              createdAt: 1714486020, // Apr 30, 2024, 2:07 PM UTC
              date: '12:46',
              nickname: 'leah',
              userId: 'leahUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '15',
              type: 1,
              message: 'The more messages the better',
              createdAt: 1714486030, // Apr 30, 2024, 2:07 PM UTC
              date: '12:46',
              nickname: 'luke',
              userId: 'lukeUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '16',
              type: 1,
              message: 'We cannot grant you the rank of messager',
              createdAt: 1714486040, // Apr 30, 2024, 2:07 PM UTC
              date: '12:46',
              nickname: 'windoo',
              userId: 'windooUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
          [
            {
              id: '17',
              type: 1,
              message:
                'deathhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhstarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdeathstartttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
              createdAt: 1714486050, // Apr 30, 2024, 2:07 PM UTC
              date: '12:46',
              nickname: 'vader',
              userId: 'vaderUserId',
              isDuplicated: false,
              isRegistered: true,
            },
          ],
        ],
      },
    },
    updateFileAttachments: jest.fn(),
    updateImageAttachments: jest.fn(),
    removeFilePreview: jest.fn(),
    setDmChannelOnSelection: jest.fn(),
  }

  it('renders component', () => {
    const { toJSON } = renderComponent(<Chat {...props} />)

    expect(toJSON()).toMatchSnapshot()
  })
})
