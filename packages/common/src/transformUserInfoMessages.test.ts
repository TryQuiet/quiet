import { ChannelMessage, DisplayableMessage, InfoMessagesType, MessageType } from '@quiet/types'
import { transformUserInfoMessages } from './transformUserInfoMessages'

describe('transformUserInfoMessages', () => {
  const ownerNickname = 'owner'
  const communityName = 'dev'
  const userNickname = 'bob'

  it('user joined - message in channel', () => {
    const message: DisplayableMessage = {
      id: 'id',
      type: MessageType.Info,
      message: InfoMessagesType.USER_JOINED,
      createdAt: 1,
      date: '1',
      nickname: userNickname,
      isRegistered: false,
      isDuplicated: false,
      pubKey: 'pubKey',
    }

    const transformedMessage = transformUserInfoMessages(ownerNickname, communityName, userNickname, message)
    const expectedTransformedMessage = {
      id: 'id',
      type: 3,
      message:
        '**@bob** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ)',
      createdAt: 1,
      date: '1',
      nickname: 'bob',
      isRegistered: false,
      isDuplicated: false,
      pubKey: 'pubKey',
    }
    expect(transformedMessage).toMatchObject(expectedTransformedMessage)
  })

  it('user joined - notification', () => {
    const message: ChannelMessage = {
      id: 'id',
      type: MessageType.Info,
      message: InfoMessagesType.USER_JOINED,
      createdAt: 1,
      pubKey: 'pubKey',
      channelId: 'channelId',
      signature: 'sig',
    }

    const transformedMessage = transformUserInfoMessages(ownerNickname, communityName, userNickname, message, true)

    const expectedTransformedMessage = {
      id: 'id',
      type: 3,
      message: '@bob has joined and will be registered soon. 🎉',
      createdAt: 1,
      pubKey: 'pubKey',
      channelId: 'channelId',
      signature: 'sig',
    }
    expect(transformedMessage).toMatchObject(expectedTransformedMessage)
  })

  it('message not info type', () => {
    const message: DisplayableMessage = {
      id: 'id',
      type: MessageType.Basic,
      message: InfoMessagesType.USER_JOINED,
      createdAt: 1,
      date: '1',
      nickname: userNickname,
      isRegistered: false,
      isDuplicated: false,
      pubKey: 'pubKey',
    }

    const transformedMessage = transformUserInfoMessages(ownerNickname, communityName, userNickname, message)

    const expectedTransformedMessage = {
      id: 'id',
      type: 1,
      message: 'user-joined',
      createdAt: 1,
      date: '1',
      nickname: 'bob',
      isRegistered: false,
      isDuplicated: false,
      pubKey: 'pubKey',
    }
    expect(transformedMessage).toMatchObject(expectedTransformedMessage)
  })

  it('wrong InfoMessagesType - return empty message', () => {
    const message: DisplayableMessage = {
      id: 'id',
      type: MessageType.Info,
      message: 'custom type',
      createdAt: 1,
      date: '1',
      nickname: userNickname,
      isRegistered: false,
      isDuplicated: false,
      pubKey: 'pubKey',
    }

    const transformedMessage = transformUserInfoMessages(ownerNickname, communityName, userNickname, message)
    const expectedTransformedMessage = {
      id: 'id',
      type: 3,
      message: '',
      createdAt: 1,
      date: '1',
      nickname: 'bob',
      isRegistered: false,
      isDuplicated: false,
      pubKey: 'pubKey',
    }
    expect(transformedMessage).toMatchObject(expectedTransformedMessage)
  })
})
