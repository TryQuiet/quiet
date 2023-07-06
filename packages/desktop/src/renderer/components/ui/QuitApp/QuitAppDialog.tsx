import React from 'react'

import { styled } from '@mui/material/styles'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const PREFIX = 'QuitAppDialog'

const classes = {
  root: `${PREFIX}root`,
  info: `${PREFIX}info`,
  dialogContent: `${PREFIX}dialogContent`,
  buttonNo: `${PREFIX}buttonNo`,
  buttonYes: `${PREFIX}buttonYes`,
  dialogActions: `${PREFIX}dialogActions`,
  typography: `${PREFIX}typography`,
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  [`& .${classes.root}`]: {},

  [`& .${classes.info}`]: {
    fontWeight: 500,
  },

  [`& .${classes.dialogContent}`]: {
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`,
  },

  [`& .${classes.buttonNo}`]: {
    borderRight: `1px solid ${theme.palette.colors.veryLightGray}`,
    cursor: 'pointer',
    padding: 10,
  },

  [`& .${classes.buttonYes}`]: {
    cursor: 'pointer',
    padding: 10,
    color: theme.palette.colors.lushSky,
  },

  [`& .${classes.dialogActions}`]: {
    padding: 0,
  },

  [`& .${classes.typography}`]: {
    textAlign: 'center',
  },
}))

interface QuitAppDialogProps {
  handleClose: () => void
  handleQuit: () => void
  open: boolean
}

export const QuitAppDialog: React.FC<QuitAppDialogProps> = ({ handleClose, handleQuit, open }) => {
  return (
    <StyledDialog onClose={handleClose} open={open}>
      <DialogContent className={classes.dialogContent}>
        <Typography className={classes.info} variant='body2'>
          Do you want to quit Quiet?
        </Typography>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Grid container direction='row' justifyContent='flex-end'>
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
    </StyledDialog>
  )
}

export default QuitAppDialog
