/* global Notification */
import { soundTypeToAudio } from '../shared/sounds'
import electronStore from '../shared/electronStore'
import history from '../shared/history'
import { DisplayableMessage } from '@zbayapp/nectar'

export const createNotification = async ({
  title,
  body,
  data
}: {
  title: string
  body: string
  data: any
}) => {
  const sound = parseInt(electronStore.get('notificationCenter.user.sound'))
  if (sound) {
    await soundTypeToAudio[sound].play()
  }
  const notification = new Notification(title, { body: body })
  notification.onclick = () => {
    history.push(data)
  }
  return notification
}

export const displayDirectMessageNotification = async ({
  message,
  username
}: {
  message: DisplayableMessage
  username: string
}) => {
  if (!message || !message.message) {
    return
  }
  return await createNotification({
    title: `New message from ${username || 'Unnamed'}`,
    body: `${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`,
    data: `/main/direct-messages/${username}`
  })
}

export default {
  createNotification
}
