import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  button: {
    padding: 0,
    textTransform: 'none',
    '&:hover': {
      opacity: 1,
      backgroundColor: 'inherit'
    },
    opacity: 0.5
  },
  buttonText: {
    color: theme.palette.colors.white
  }
})

const setModalTab = (onReceive, setTabToOpen) => {
  setTabToOpen()
  onReceive()
}

export const WalletPanelActions = ({ classes, onSend, onReceive, setTabToOpen }) => (
  <Grid container direction='row' spacing={1}>
    <Grid item>
      <Button variant='text' className={classes.button} onClick={() => setModalTab(onReceive, setTabToOpen)}>
        <Typography variant='caption' className={classes.buttonText}>
          Add Funds
        </Typography>
      </Button>
    </Grid>
    <Grid item>
      <Button variant='text' className={classes.button} onClick={onSend}>
        <Typography variant='caption' className={classes.buttonText}>
          Send Funds
        </Typography>
      </Button>
    </Grid>
  </Grid>
)

WalletPanelActions.propTypes = {
  classes: PropTypes.object.isRequired,
  onSend: PropTypes.func.isRequired,
  onReceive: PropTypes.func.isRequired,
  setTabToOpen: PropTypes.func.isRequired
}

export default R.compose(
  withStyles(styles),
  React.memo
)(WalletPanelActions)
