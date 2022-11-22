import React from 'react'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { makeStyles } from '@mui/material/styles'

const useStyles = makeStyles(theme => ({
  root: {},
  info: {
    fontWeight: 500
  },
  dialogContent: {
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  buttonNo: {
    borderRight: `1px solid ${theme.palette.colors.veryLightGray}`,
    cursor: 'pointer',
    padding: 10
  },
  buttonYes: {
    cursor: 'pointer',
    padding: 10,
    color: theme.palette.colors.lushSky
  },
  dialogActions: {
    padding: 0
  },
  typography: {
    textAlign: 'center'
  }
}))

interface QuitAppDialogProps {
  handleClose: () => void
  handleQuit: () => void
  open: boolean
}

export const QuitAppDialog: React.FC<QuitAppDialogProps> = ({ handleClose, handleQuit, open }) => {
  const classes = useStyles({})
  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogContent className={classes.dialogContent}>
        <Typography className={classes.info} variant='body2'>
          Do you want to quit Quiet?
        </Typography>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Grid container direction='row' justify='flex-end'>
          <Grid item xs className={classes.buttonNo} onClick={handleClose}>
            <Typography className={classes.typography} variant='body1'>
              No
            </Typography>
          </Grid>
          <Grid item xs className={classes.buttonYes} onClick={handleQuit}>
            <Typography className={classes.typography} variant='body1'>
              Yes
            </Typography>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  )
}

export default QuitAppDialog
