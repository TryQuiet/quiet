import React from 'react'

import { useSnackbar } from 'notistack'

import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  dismiss: {
    fontWeight: theme.typography.fontWeightMedium,
    color: '#fff'
  }
}))

interface DismissSnackbarActionProps {
  notificationKey: string | number
}

export const DismissSnackbarAction: React.FC<DismissSnackbarActionProps> = ({
  notificationKey
}) => {
  const classes = useStyles({})

  const { closeSnackbar } = useSnackbar()

  return (
    <Button
      onClick={() => {
        closeSnackbar(notificationKey)
      }}
      size='small'
      className={classes.dismiss}>
      Dismiss
    </Button>
  )
}

export const notifierAction = (key: string | number) => <DismissSnackbarAction notificationKey={key} />

export default DismissSnackbarAction
