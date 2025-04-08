import { ChannelMessage, PublicChannel } from '@quiet/types'
import { isMessage, isDirectMessage, isChannel, isEncryptedMessage } from './validators'
import { EncryptedMessage } from '../storage/channels/messages/messages.types'

describe('Validators - Messages', () => {
  test('message is valid', () => {
    // message with media is valid
    const msg = {
      id: 'fzxjdiasf8ashfisfd',
      type: 1,
      message: 'hello',
      createdAt: 1234567,
      channelId: '123n23l234lk234',
      userId: 'szakalak',
    }
    expect(isMessage(msg)).toBeTruthy()
  })
  test('message with media is valid', () => {
    const msg: ChannelMessage = {
      id: 'fzxjdiasf8ashfisfd',
      userId: 'szakalak',
      type: 1,
      message: 'hello',
      createdAt: 1234567,
      channelId: '123n23l234lk234',
      media: {
        cid: '123',
        message: {
          id: 'fzxjdiasf8ashfisfd',
          channelId: '123n23l234lk234',
        },
        path: '/path/to/file',
        name: 'file',
        ext: '.png',
      },
    }
    expect(isMessage(msg)).toBeTruthy()
  })
  test('message is lacking required proprty', () => {
    const msg = {
      type: 1,
      message: 'hello',
      createdAt: 1234567,
      channelId: '123n23l234lk234',
    }
    expect(isMessage(msg as ChannelMessage)).toBeFalsy()
  })
  test('message property has wrong format', () => {
    const msg = {
      id: 8,
      type: 1,
      message: 123,
      createdAt: 1234567,
      channelId: '123n23l234lk234',
    }
    expect(isMessage(msg as unknown as ChannelMessage)).toBeFalsy()
  })
  test('message with invalid media property is invalid', () => {
    const msg = {
      id: 'fzxjdiasf8ashfisfd',
      type: 1,
      author: 'szakalak',
      userId: 'szakalak',
      message: 'hello',
      createdAt: 1234567,
      channelId: '123n23l234lk234',
      media: {
        message: {
          id: 'fzxjdiasf8ashfisfd',
          channelId: '123n23l234lk234',
        },
        path: '/path/to/file',
        name: 'file',
        ext: '.png',
      },
    }
    expect(isMessage(msg as unknown as ChannelMessage)).toBeFalsy()
  })
})

describe('Validators - Encrypted Messages', () => {
  test('valid encrypted message passes', () => {
    const validEncryptedMessage = {
      id: 'msg-123',
      contents: {
        contents: Buffer.from([1, 2, 3]),
        scope: {
          generation: 0,
          type: 'ROLE',
          name: 'member',
        },
      },
      createdAt: 1710000000000,
      channelId: 'channel-abc',
      encSignature: {
        author: {
          generation: 0,
          type: 'USER',
          name: 'user-xyz',
        },
        signature: 'abc123signaturevalue',
      },
    }
    expect(isEncryptedMessage(validEncryptedMessage as unknown as EncryptedMessage)).toBeTruthy()
  })

  test('missing encSignature fails', () => {
    const invalidEncryptedMessage = {
      id: 'msg-123',
      contents: {
        contents: Buffer.from([1, 2, 3]),
        scope: {
          generation: 0,
          type: 'ROLE',
          name: 'member',
        },
      },
      createdAt: 1710000000000,
      channelId: 'channel-abc',
    }
    expect(isEncryptedMessage(invalidEncryptedMessage as unknown as EncryptedMessage)).toBeFalsy()
  })

  test('contents.contents not buffer fails', () => {
    const invalidEncryptedMessage = {
      id: 'msg-123',
      contents: {
        contents: new Uint8Array([1, 2, 3]),
        scope: {
          generation: 0,
          type: 'ROLE',
          name: 'member',
        },
      },
      createdAt: 1710000000000,
      channelId: 'channel-abc',
      encSignature: {
        author: {
          generation: 0,
          type: 'USER',
          name: 'user-xyz',
        },
        signature: 'abc123signaturevalue',
      },
    }
    expect(isEncryptedMessage(invalidEncryptedMessage as unknown as EncryptedMessage)).toBeFalsy()
  })
})

describe('Validators - Channels', () => {
  test('message is valid', () => {
    const channel = {
      name: 'quiet',
      description: 'quiet',
      owner: 'szakalakakaaakaka',
      timestamp: 12341234,
      id: 'sadfdasfsadfsdfsnfsdjfdsfsdfjsdf',
    }
    expect(isChannel(channel)).toBeTruthy()
  })
  test('message is lacking required proprty', () => {
    const channel = {
      name: 'quiet',
      description: 'quiet',
      owner: 'szakalakakaaakaka',
      id: 'sadfdasfsadfsdfsnfsdjfdsfsdfjsdf',
    }
    expect(isChannel(channel as unknown as PublicChannel)).toBeFalsy()
  })
  test('message property has wrong format', () => {
    const channel = {
      name: 'quiet',
      description: 'quiet',
      owner: 'szakalakakaaakaka',
      timestamp: 'asfasdf',
      id: 'sadfdasfsadfsdfsnfsdjfdsfsdfjsdf',
    }
    expect(isChannel(channel as unknown as PublicChannel)).toBeFalsy()
  })
})

describe('Validators - Direct Messages', () => {
  test('message is valid', () => {
    const msg =
      '2AguTZ3+hts4+eephmT4KAYRGg+jhCuoE03h/GiNGgTFk6OadVPQyzG5MC6TcyfRiao/6ENr1USnJ9zO9wcUoIUXu8RrS1MSA9/UTCeBytnqwCyffkvBLQvtnF+/7EWwpylJoewxhl0/MwAfMk0QDPzd8kSuguLKSID45AwKxO2Vh1Vq/pyjkH+7nURj7nw62pxyPXr3Jn0AEwAiTl8ZDmpb2s5wavWgk+ma7KJUoxSwgMepQtw+E5X5CLtqx8DS19H0lvcQBO5wMahLlc24zohOkKPVKUXrmcDJKdZaXNRFwR4o+CpnM/BBqB0QL1Y9U3OXevduWRwtiWc/oC07LLhczl5QqJ6m8mK8StSiXq0='
    expect(isDirectMessage(msg)).toBeTruthy()
  })
  test('message has wrong length', () => {
    const msg =
      '2AguTZ3+hts4+eephmT4KAYRGg+jhCuoE03h/GiNGgTFk6OadVPQyzG5MC6TcyfRiao/6ENr1USnJ9zO9wcUoIUXu8RrS1MSA9/UTCeBytnqwCyffkvBLQvtnF+/7EWwpylJoewxhl0/MwAfMk0QDPzd8kSuguLKSID45AwKxO2Vh1Vq/pyjkH+7nURj7nw62pxyPXr3Jn0AEwAiTl8ZDmpb2s5wavWgk+ma7KJUoxSwgMepQtw+E5X5CLtqx8DS19H0lvcQBO5wMahLlc24zohOkKPVKUXrmcDJKdZaXNRFwR4o+CpnM/BBqB0QL1Y9U3OXevduWRwtzl5QqJ6m8mK8StSiXq0='
    expect(isDirectMessage(msg)).toBeFalsy()
  })
  test('message has wrong format', () => {
    const msg =
      'c64ff83aebf43571d6346339942fb20e6dcb3df9d9895c6378ab9d1b8f8ff0f8364c33e82376f38a70fbe6f73542951c028232634d33c4a884223046c1da97a6e5159c1d8d2a70e097c3b85c37e28ecf0c809cae0350c0ef227a57882c9f6cc4e0c3a91b=06f7c64c8177fe95e8fb7ab3408d9f3aa31024c9056df5941564ef827236f2329f493b5346cf95e68575f1a8edf48034d38ee0e52b944f65abff39e8502c1836429a45d7a7cab76b573926de39ff0e0bbe8'
    expect(isDirectMessage(msg)).toBeFalsy()
  })
})
