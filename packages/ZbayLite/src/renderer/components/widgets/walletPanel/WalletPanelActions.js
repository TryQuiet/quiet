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
  },
  text: {
    color: theme.palette.colors.white,
    fontSize: 12,
    fontWeight: 500,
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      borderStyle: 'solid',
      position: 'absolute',
      bottom: '100%',
      left: '25%',
      borderWidth: 6,
      borderColor: 'transparent transparent black transparent'
    }
  },
  deposit: {
    position: 'relative',
    background: theme.palette.colors.trueBlack,
    color: theme.typography.body1.color,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8,
    cursor: 'pointer',
    lineHeight: '16px'
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
  showDepositInfo,
  openDepositMonet
}) => {
  return (
    <Grid container direction='row' spacing={1}>
      <Grid item>
        <Button
          variant='text'
          className={classes.button}
          onClick={() => setModalTab(onReceive, setTabToOpen)}
        >
          <Typography variant='caption' className={classes.buttonText}>
            Add Funds
          </Typography>
        </Button>
      </Grid>
      <Grid item>
        <Button
          variant='text'
          className={classes.button}
          onClick={showDepositInfo ? openDepositMonet : onSend}
        >
          <Typography variant='caption' className={classes.buttonText}>
            Send Funds
          </Typography>
        </Button>
      </Grid>
      {showDepositInfo && (
        <div className={classes.deposit} onClick={() => setModalTab(onReceive, setTabToOpen)}>
          <span className={classes.text}>Add funds now</span>
        </div>
      )}
    </Grid>
  )
}
WalletPanelActions.propTypes = {
  classes: PropTypes.object.isRequired,
  onSend: PropTypes.func.isRequired,
  onReceive: PropTypes.func.isRequired,
  setTabToOpen: PropTypes.func.isRequired,
  openDepositMonet: PropTypes.func.isRequired,
  showDepositInfo: PropTypes.bool
}

export default R.compose(
  withStyles(styles),
  React.memo
)(WalletPanelActions)
