import { DisplayableMessage } from '@quiet/types'

interface IGenerateMessages {
  amount?: number
  type?: number
  message?: string
  nickname?: string
  createdAtSeconds?: number
}

const defaults = { amount: 1, type: 1, message: 'message', nickname: 'gringo', createdAtSeconds: 0 }

export const generateMessages = (options: IGenerateMessages = defaults) => {
  let { amount, type, message, nickname, createdAtSeconds } = { ...options }
  amount = amount || defaults.amount
  type = type || defaults.type
  message = message || defaults.message
  nickname = nickname || defaults.nickname
  createdAtSeconds = createdAtSeconds || defaults.createdAtSeconds
  const messages: DisplayableMessage[] = []
  for (let i = 0; i < amount; i++) {
    messages.push({
      id: `${i}`,
      type,
      message: `${message}${i}`,
      createdAt: createdAtSeconds,
      date: 'string',
      nickname,
      isDuplicated: false,
      isRegistered: true,
      pubKey: `${nickname}PubKey`,
    })
  }

  return messages
}
