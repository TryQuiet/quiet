import { DisplayableMessage } from '@quiet/state-manager'

interface IGenerateMessages {
  amount?: number
  type?: number
  message?: string
  nickname?: string
}

const defaults = { amount: 1, type: 1, message: 'message', nickname: 'gringo' }

export const generateMessages = (options: IGenerateMessages = defaults) => {
  let { amount, type, message, nickname } = { ...options }
  amount = amount || defaults.amount
  type = type || defaults.type
  message = message || defaults.message
  nickname = nickname || defaults.nickname
  const messages: DisplayableMessage[] = []
  for (let i = 0; i < amount; i++) {
    messages.push({
      id: `${i}`,
      type,
      message: `${message}${i}`,
      createdAt: 0,
      date: 'string',
      nickname,
    })
  }

  return messages
}
