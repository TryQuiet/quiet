import { channelMessagesToText } from './exportMessages'
import { MessagesDailyGroups } from '@quiet/types'

const messages: MessagesDailyGroups = {
  '2023-11-22': [
    [
      {
        id: '1',
        type: 1,
        message: 'Hello, World!',
        createdAt: 1637547600,
        date: 'Nov 22, 12:18 PM',
        nickname: 'JohnDoe',
        isRegistered: true,
        isDuplicated: false,
        pubKey: 'public_key',
      },
      {
        id: '2',
        type: 1,
        message: 'How are you?',
        createdAt: 1637551200,
        date: 'Nov 22, 12:18 PM',
        nickname: 'JaneDoe',
        isRegistered: true,
        isDuplicated: false,
        pubKey: 'public_key_2',
      },
      {
        id: '3',
        type: 1,
        message: 'Hi there!',
        createdAt: 1637554800,
        date: 'Nov 22, 1:14 PM',
        nickname: 'Alice',
        isRegistered: true,
        isDuplicated: false,
        pubKey: 'public_key_3',
      },
    ],
  ],
}

describe('channelMessagesToText', () => {
  it('should convert channel messages to text format', () => {
    const result = channelMessagesToText(messages)
    expect(result).toMatchSnapshot(`
      "[JohnDoe Nov 22, 12:18 PM]
      Hello, World!

      [JaneDoe Nov 22, 12:18 PM]
      How are you?

      [Alice Nov 22, 1:14 PM]
      Hi there!
    `)
  })
})
