export const createNotification = ({ title, body }) => new window.Notification(title, {
  body
})

export const displayMessageNotification = ({ message, channel }) => createNotification({
  title: `New message in ${channel.get('name')}`,
  body: `${message.sender.username || 'Anonymous'}: ${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`
})

export const displayDirectMessageNotification = ({ message, username }) => createNotification({
  title: `New message from ${username || 'Unnamed'}`,
  body: `${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`
})

export default {
  createNotification,
  displayMessageNotification
}
