import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

import Tooltip from '../../ui/Tooltip'

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
  },
  tooltip: {
    marginTop: 5,
    cursor: 'pointer'
  }
})

const setModalTab = (onReceive, setTabToOpen) => {
  setTabToOpen()
  onReceive()
}

export const WalletPanelActions = ({
  classes,
  onSend,
  onReceive,
  setTabToOpen,
  showDepositInfo
}) => {
  return (
    <Grid container direction='row' spacing={1}>
      <Grid item>
        <Tooltip
          open={showDepositInfo}
          title='Add funds now'
          className={classes.tooltip}
          placement='bottom'
          interactive
          onClick={() => setModalTab(onReceive, setTabToOpen)}
        >
          <Button
            variant='text'
            className={classes.button}
            onClick={() => setModalTab(onReceive, setTabToOpen)}
          >
            <Typography variant='caption' className={classes.buttonText}>
              Add Funds
            </Typography>
          </Button>
        </Tooltip>
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
}
WalletPanelActions.propTypes = {
  classes: PropTypes.object.isRequired,
  onSend: PropTypes.func.isRequired,
  onReceive: PropTypes.func.isRequired,
  setTabToOpen: PropTypes.func.isRequired,
  showDepositInfo: PropTypes.number
}

export default R.compose(
  withStyles(styles),
  React.memo
)(WalletPanelActions)
