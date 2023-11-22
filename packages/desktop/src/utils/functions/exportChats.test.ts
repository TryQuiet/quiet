import { channelMessagesToText } from './exportChats'
import { MessagesDailyGroups } from '@quiet/types'

const messages: MessagesDailyGroups = {
  '2023-11-22': [
    [
      {
        id: '1',
        type: 1,
        message: 'Hello, World!',
        createdAt: 1637547600,
        date: '2023-11-22',
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
        date: '2023-11-22',
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
        date: '2023-11-22',
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
      "[JohnDoe 2023-11-22]
      Hello, World!

      [JaneDoe 2023-11-22]
      How are you?

      [Alice 2023-11-22]
      Hi there!

      [Bob 2023-11-23]
      Good morning!"
    `)
  })
})
