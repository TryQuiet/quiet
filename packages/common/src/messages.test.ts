import { PublicChannelStorage } from '@quiet/types'
import { generateChannelId } from './channelAddress'
import { createdChannelMessage, userJoinedMessage, verifyUserInfoMessage } from './messages'

describe('messages helper', () => {
  const username = 'johnny'
  const otherUsername = 'not-johnny'

  const generalChannel: PublicChannelStorage = {
    name: 'general',
    description: 'Welcome to #general',
    timestamp: 1,
    owner: username,
    id: generateChannelId('general'),
    messages: { ids: [], entities: {} },
    public: true,
    teamId: 'foobar',
  }

  const sportChannel: PublicChannelStorage = {
    name: 'sport',
    description: 'Welcome to #sport',
    timestamp: 1,
    owner: username,
    id: generateChannelId('sport'),
    messages: { ids: [], entities: {} },
    public: true,
    teamId: 'foobar',
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

  it('owner created general channel message', () => {
    const expectedMessage = 'Created #general'
    const message = verifyUserInfoMessage(username, username, generalChannel)
    expect(message).toEqual(expectedMessage)
  })

  it('verifyUserInfoMessage - general channel', () => {
    const expectedMessage = `**@${otherUsername}** has joined and will be registered soon. 🎉 [Learn more](https://github.com/TryQuiet/quiet/wiki/Quiet-FAQ#how-does-username-registration-work)`
    const message = verifyUserInfoMessage(otherUsername, otherUsername, generalChannel)
    expect(message).toEqual(expectedMessage)
  })

  it('verifyUserInfoMessage - owner created other channel', () => {
    const expectedMessage = 'Created #sport'
    const message = verifyUserInfoMessage(username, username, sportChannel)
    expect(message).toEqual(expectedMessage)
  })
})
