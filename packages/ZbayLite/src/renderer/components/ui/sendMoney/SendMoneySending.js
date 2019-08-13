import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import DoneIcon from '@material-ui/icons/Done'

import SpinnerLoader from '../SpinnerLoader'

const styles = theme => ({
  root: {
    padding: 3 * theme.spacing.unit,
    textAlign: 'center'
  },
  info: {
    marginTop: theme.spacing.unit
  },
  button: {
    marginTop: 4 * theme.spacing.unit,
    padding: 2 * theme.spacing.unit
  },
  doneIcon: {
    fontSize: '8rem'
  }
})

export const SendMoneySending = ({
  classes,
  amountZec,
  amountUsd,
  feeZec,
  feeUsd,
  step,
  setStep,
  sent
}) => {
  return (
    <Grid container className={classes.root} spacing={0} alignItems='center' justify='center'>
      {sent === false ? (
        <Grid item xs={12}>
          <SpinnerLoader size={80} message='Sending transaction' />
        </Grid>
      ) : (
        <>
          <Grid item xs={12}>
            <DoneIcon className={classes.doneIcon} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant='h5'>Your Zcash send is complete!</Typography>
          </Grid>
          <Grid item xs={12} className={classes.info}>
            <Typography variant='body1'>
              You sent {(parseInt(amountZec) + feeZec)} ZEC (${(parseInt(amountUsd) + feeUsd).toFixed(4)} USD) to the address you
              specified.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              color='primary'
              variant='contained'
              onClick={() => setStep(step + 1)}
              fullWidth
              className={classes.button}
            >
              View Details
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  )
}

SendMoneySending.propTypes = {
  classes: PropTypes.object.isRequired,
  amountUsd: PropTypes.string.isRequired,
  amountZec: PropTypes.string.isRequired,
  feeUsd: PropTypes.number.isRequired,
  feeZec: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  step: PropTypes.number.isRequired,
  sent: PropTypes.bool.isRequired
}

SendMoneySending.defaultProps = {}

export default withStyles(styles)(SendMoneySending)
