import { PublicChannelStorage } from '@quiet/types'
import { generateChannelId } from './channelAddress'
import { createdChannelMessage, userJoinedMessage, verifyUserInfoMessage } from './messages'

describe('messages helper', () => {
  const username = 'johnny'

  const generalChannel: PublicChannelStorage = {
    name: 'general',
    description: 'Welcome to #general',
    timestamp: 1,
    owner: username,
    id: generateChannelId('general'),
    messages: { ids: [], entities: {} },
  }

  const sportChannel: PublicChannelStorage = {
    name: 'sport',
    description: 'Welcome to #sport',
    timestamp: 1,
    owner: username,
    id: generateChannelId('sport'),
    messages: { ids: [], entities: {} },
  }
  it('createdChannelMessage', () => {
    const expectedMessage = 'Created #sport'
    const message = createdChannelMessage(sportChannel.name)
    expect(message).toEqual(expectedMessage)
  })

  it('userJoinedMessage', () => {
    const expectedMessage =
      '**@johnny** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)'
    const message = userJoinedMessage(username)
    expect(message).toEqual(expectedMessage)
  })

  it('verifyUserInfoMessage - general channel', () => {
    const expectedMessage =
      '**@johnny** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)'
    const message = verifyUserInfoMessage(username, generalChannel)
    expect(message).toEqual(expectedMessage)
  })

  it('verifyUserInfoMessage - other channel', () => {
    const expectedMessage = 'Created #sport'
    const message = verifyUserInfoMessage(username, sportChannel)
    expect(message).toEqual(expectedMessage)
  })
})
