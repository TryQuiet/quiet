import React from 'react'

import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  root: {},
  info: {
    fontWeight: 500,
    fontSize: 18
  },
  dialogContent: {
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`,
    width: 300,
    textAlign: 'center',
    padding: '24px !important'
  },
  buttonNo: {
    borderRight: `1px solid ${theme.palette.colors.veryLightGray}`,
    cursor: 'pointer',
    padding: '18px 16px'
  },
  buttonYes: {
    cursor: 'pointer',
    padding: '18px 16px',
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
}))

interface ConfirmModalProps {
  handleClose: () => void
  title: string
  actionName: string
  cancelName?: string
  handleAction: () => void
  open: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  handleClose,
  title,
  actionName,
  cancelName = 'Cancel',
  handleAction,
  open
}) => {
  const classes = useStyles({})
  return (
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
              {cancelName}
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
}

export default ConfirmModal
