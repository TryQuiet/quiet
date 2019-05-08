import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { withSnackbar } from 'notistack'

export const Notifier = ({ notifications, enqueueSnackbar, removeSnackbar }) => {
  const [displayed, setDisplayed] = useState([])
  useEffect(() => {
    notifications.map(
      n => {
        const notification = n.toJS()
        if (displayed.includes(notification.key)) {
          return
        }
        enqueueSnackbar(notification.message, notification.options)
        setDisplayed([...displayed, notification.key])
        removeSnackbar(notification.key)
      }
    )
  }, [notifications])
  return null
}

export default R.compose(
  React.memo,
  withSnackbar
)(Notifier)
