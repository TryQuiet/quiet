import { createSelector } from 'reselect'

import { NotificationStore } from "./../handlers/notifications";

const notifications = (s): NotificationStore => s.notifications as NotificationStore

const data = createSelector(notifications, s => s)

export default {
  data
}
