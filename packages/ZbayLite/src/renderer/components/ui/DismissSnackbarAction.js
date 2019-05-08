import React from 'react'
import * as R from 'ramda'
import { useSnackbar } from 'notistack'

import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  dismiss: {
    fontWeight: theme.typography.fontWeightMedium,
    color: '#fff'
  }
})

export const DismissSnackbarAction = ({ classes, notificationKey }) => {
  const { closeSnackbar } = useSnackbar()
  return (
    <Button onClick={() => { closeSnackbar(notificationKey) }} size='small' className={classes.dismiss}>
      Dismiss
    </Button>
  )
}

const DismissSnackbarActionWrapped = R.compose(
  React.memo,
  withStyles(styles)
)(DismissSnackbarAction)

export const notifierAction = (key) => (<DismissSnackbarActionWrapped notificationKey={key} />)

export default DismissSnackbarActionWrapped
