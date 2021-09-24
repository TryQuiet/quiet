import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { withSnackbar } from 'notistack'

export const Notifier = ({ notifications, enqueueSnackbar, removeSnackbar }) => {
  const [displayed, setDisplayed] = useState([])
  useEffect(() => {
    notifications.map(
      n => {
        if (displayed.includes(n.key)) {
          return
        }
        enqueueSnackbar(n.message, n.options)
        setDisplayed([...displayed, n.key])
        removeSnackbar(n.key)
      }
    )
  }, [notifications])
  return null
}

export default R.compose(
  React.memo,
  withSnackbar
)(Notifier)
