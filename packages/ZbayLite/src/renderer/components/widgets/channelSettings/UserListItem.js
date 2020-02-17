import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import ConfirmModal from './ConfirmModal'

const styles = theme => ({
  root: {
    padding: `12px 16px`,
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  name: {
    color: theme.palette.colors.trueBlack,
    fontWeight: 500
  },
  actionName: {
    color: theme.palette.colors.lushSky,
    '&:hover': {
      color: theme.palette.colors.trueBlack
    },
    textTransform: 'lowercase'
  },
  pointer: {
    cursor: 'pointer'
  }
})

export const UserListItem = ({
  classes,
  name,
  actionName,
  action,
  disableConfirmation,
  prefix
}) => {
  const [openDialog, setOpenDialog] = useState(false)
  return (
    <Grid
      container
      item
      xs
      className={classes.root}
      justify='space-between'
      alignItems='center'
    >
      <ConfirmModal
        open={openDialog}
        title={`${actionName} '${name}'`}
        actionName={actionName}
        handleClose={() => setOpenDialog(false)}
        handleAction={action}
      />
      <Grid item>
        <Typography className={classes.name} variant='subtitle1'>
          {prefix}
          {name}
        </Typography>
      </Grid>
      <Grid
        item
        className={classes.pointer}
        onClick={disableConfirmation ? action : () => setOpenDialog(true)}
      >
        <Typography className={classes.actionName} variant='body2'>
          {actionName}
        </Typography>
      </Grid>
    </Grid>
  )
}
UserListItem.propTypes = {
  classes: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  prefix: PropTypes.string.isRequired,
  actionName: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  disableConfirmation: PropTypes.bool
}
UserListItem.defaultProps = {
  prefix: '@'
}

export default withStyles(styles)(UserListItem)
