import {DisplayableMessage} from '@quiet/state-manager'

export const generateMessages = (amount: number, type: number = 1, message: string = 'message', nickname: string = 'gringo') => {
  const messages: DisplayableMessage[] = []
  for (let i = 0; i < amount; i++) {
    messages.push({
      id: `${i}`,
      type,
      message: `${message}${i}`,
      createdAt: 0,
      date: 'string',
      nickname
    })
  }

  return messages
}