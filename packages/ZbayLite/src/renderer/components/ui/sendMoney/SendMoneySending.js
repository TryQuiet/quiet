import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import { DateTime } from 'luxon'

import Icon from '../Icon'
import checkmark from '../../../static/images/checkmark.svg'
const styles = theme => ({
  root: {
    padding: theme.spacing(3),
    textAlign: 'center'
  },
  info: {
    marginTop: theme.spacing(1)
  },
  icon: {
    marginBottom: 20
  },
  infoText: {
    fontSize: 14,
    marginTop: 16,
    lineHeight: '24px'
  },
  button: {
    marginTop: 32,
    width: 145,
    height: 60,
    padding: theme.spacing(2),
    textTransform: 'none',
    backgroundColor: theme.palette.colors.zbayBlue,
    fontWeight: 'normal',
    fontSize: 16,
    lineHeight: '19px'
  }
})

export const SendMoneySending = ({
  classes,
  amountZec,
  amountUsd,
  feeZec,
  feeUsd,
  recipient,
  memo,
  setStep,
  handleClose,
  resetForm,
  openSentFundsModal
}) => {
  return (
    <Grid
      container
      className={classes.root}
      spacing={0}
      alignItems='center'
      justify='center'
    >
      <>
        <Grid item xs={12}>
          <Icon className={classes.icon} src={checkmark} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant='h3'>Send complete</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography className={classes.infoText} variant='body1'>
            You sent {(parseFloat(amountZec) + feeZec).toFixed(4)} ZEC ($
            {(parseFloat(amountUsd) + feeUsd).toFixed(2)} USD) to a Zcash
            recipient
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
              handleClose()
              setStep(1)
              resetForm()
              openSentFundsModal({
                amountZec,
                amountUsd,
                feeUsd,
                feeZec,
                recipient,
                memo,
                timestamp: DateTime.utc().toSeconds()
              })
            }}
            fullWidth
            className={classes.button}
          >
            View Details
          </Button>
        </Grid>
      </>
    </Grid>
  )
}

SendMoneySending.propTypes = {
  classes: PropTypes.object.isRequired,
  amountUsd: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  amountZec: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  feeUsd: PropTypes.number.isRequired,
  feeZec: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  step: PropTypes.number.isRequired,
  sent: PropTypes.bool.isRequired,
  openSentFundsModal: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired
}

SendMoneySending.defaultProps = {}

export default withStyles(styles)(SendMoneySending)
