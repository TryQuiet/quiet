import { MessageType, type ChannelMessage, type ConsumedChannelMessage } from '@quiet/types'
import { autoDownloadFilesSaga } from '../files/autoDownloadFiles/autoDownloadFiles.saga'
import { markUnreadChannelsSaga } from '../publicChannels/markUnreadChannels/markUnreadChannels.saga'
import { updateNewestMessageSaga } from '../publicChannels/updateNewestMessage/updateNewestMessage.saga'
import { type Socket } from '../../types'
import { messagesActions } from './messages.slice'

describe('transport-rejected message fan-out', () => {
  it('stops rejected messages before download, unread, or channel-list workers produce effects', () => {
    const message = {
      id: 'forged-message',
      channelId: 'channel-id',
      userId: 'alice',
      createdAt: 1234,
      type: MessageType.Basic,
      message: 'forged',
      verified: false,
    } as ConsumedChannelMessage
    const action = messagesActions.addMessages({
      messages: [message as ChannelMessage],
      isVerified: true,
    })
    const socket = { emit: jest.fn() } as unknown as Socket

    expect(autoDownloadFilesSaga(socket, action).next()).toEqual({ done: true, value: undefined })
    expect(markUnreadChannelsSaga(action).next()).toEqual({ done: true, value: undefined })
    expect(updateNewestMessageSaga(action).next()).toEqual({ done: true, value: undefined })
    expect(socket.emit).not.toHaveBeenCalled()
  })
})
