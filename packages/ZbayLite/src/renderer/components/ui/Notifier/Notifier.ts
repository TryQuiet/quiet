import React, { useEffect, useState } from 'react'

interface NotifierProps {
  notifications: Notification[]
  enqueueSnackbar?: (message: string, options: any) => void
  removeSnackbar?: (key: string) => void
}

interface Notification {
  key: string
  message: string
  options: {
    [s: string]: any
  }
}

export const Notifier: React.FC<NotifierProps> = ({
  notifications,
  enqueueSnackbar,
  removeSnackbar
}) => {
  const [displayed, setDisplayed] = useState([])
  useEffect(() => {
    notifications.map(n => {
      if (displayed.includes(n.key)) {
        return
      }
      enqueueSnackbar(n.message, n.options)
      setDisplayed([...displayed, n.key])
      removeSnackbar(n.key)
    })
  }, [notifications])
  return null
}

export default Notifier
