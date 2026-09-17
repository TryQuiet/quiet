import React from 'react'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { Chat } from '../Chat.component'
import { Keyboard } from 'react-native'
import { ChatProps } from '../Chat.types'
import { FileActionsProps } from '../../FileAttachment/FileAttachment.types'
import { ChannelType } from '@quiet/types'

jest.useFakeTimers()

/**
 * Regression cover for the "white screen when initiating a DM" report: right after a DM is created
 * the app switches to it before its displayedName has been derived from member profiles, so the
 * chat view renders with an empty/absent channel name and an empty userProfiles map.
 */
describe('Chat component for a freshly created DM', () => {
  jest
    .spyOn(Keyboard, 'addListener')
    // @ts-expect-error
    .mockImplementation(() => ({ remove: jest.fn() }))

  const dmProps = (channelName: string): ChatProps & FileActionsProps =>
    ({
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
      setDmChannelOnSelection: jest.fn(),
      openUrl: jest.fn(),
      downloadFile: jest.fn(),
      cancelDownload: jest.fn(),
      updateFileAttachments: jest.fn(),
      updateImageAttachments: jest.fn(),
      removeFilePreview: jest.fn(),
      channel: {
        name: 'Direct message',
        description: 'Direct message',
        owner: 'me',
        timestamp: 0,
        id: 'dm_0000000000000000000000000000000000000000000000000000000000000000',
        public: false,
        teamId: 'foobar',
        type: ChannelType.DM,
        memberIds: ['me', 'them'],
      },
      channelName,
      newChat: false,
      userProfiles: {},
      isUserConnected: () => false,
      pendingMessages: {},
      messages: { count: 0, groups: {} },
    } as unknown as ChatProps & FileActionsProps)

  it.each([
    ['an empty name', ''],
    ['a missing name', undefined as unknown as string],
  ])('renders without throwing when the DM has %s', (_label, channelName) => {
    expect(() => renderComponent(<Chat {...dmProps(channelName)} />)).not.toThrow()
  })
})
