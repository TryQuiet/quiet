import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {},
  info: {
    fontWeight: 500,
    fontSize: 18
  },
  dialogContent: {
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`,
    width: 300,
    textAlign: 'center',
    padding: `24px !important`
  },
  buttonNo: {
    borderRight: `1px solid ${theme.palette.colors.veryLightGray}`,
    cursor: 'pointer',
    padding: `18px 16px`
  },
  buttonYes: {
    cursor: 'pointer',
    padding: `18px 16px`,
    color: theme.palette.colors.lushSky
  },
  dialogActions: {
    padding: 0
  },
  typography: {
    textAlign: 'center'
  },
  textYes: {
    textAlign: 'center',
    fontWeight: 500
  }
})
export const ConfirmModal = ({
  classes,
  handleClose,
  title,
  actionName,
  handleAction,
  open
}) => (
  <Dialog onClose={handleClose} open={open}>
    <DialogContent classes={{ root: classes.dialogContent }}>
      <Typography className={classes.info} variant='body2'>
        {title}
      </Typography>
    </DialogContent>
    <DialogActions className={classes.dialogActions}>
      <Grid container direction='row' justify='flex-end'>
        <Grid item xs className={classes.buttonNo} onClick={handleClose}>
          <Typography className={classes.typography} variant='body1'>
            Cancel
          </Typography>
        </Grid>
        <Grid
          item
          xs
          className={classes.buttonYes}
          onClick={() => {
            handleAction()
            handleClose()
          }}
        >
          <Typography className={classes.textYes} variant='body1'>
            {actionName}
          </Typography>
        </Grid>
      </Grid>
    </DialogActions>
  </Dialog>
)

ConfirmModal.propTypes = {
  classes: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  actionName: PropTypes.string.isRequired,
  handleAction: PropTypes.func.isRequired
}
export default R.compose(React.memo, withStyles(styles))(ConfirmModal)
