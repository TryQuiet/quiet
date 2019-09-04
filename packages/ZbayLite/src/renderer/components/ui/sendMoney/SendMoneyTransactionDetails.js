import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'

const styles = theme => ({
  root: {
    padding: theme.spacing(3)
  },
  divider: {
    color: theme.palette.primary.main,
    height: 2,
    width: '100%'
  },
  address: {
    wordBreak: 'break-all'
  },
  button: {
    padding: theme.spacing(2)
  }
})

export const SendMoneyTransactionDetails = ({
  classes,
  recipient,
  amountZec,
  amountUsd,
  feeZec,
  feeUsd,
  memo,
  submitForm,
  step,
  setStep
}) => {
  return (
    <Grid container className={classes.root} spacing={3}>
      {!(step === 4) && (
        <>
          <Grid item xs={12}>
            <Typography variant='body1'>Transaction Details</Typography>
          </Grid>
          <Divider className={classes.divider} />
        </>
      )}
      <Grid item xs={4}>
        <Typography variant='body1'>To</Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant='body1' className={classes.address}>
          {recipient}
        </Typography>
      </Grid>
      <Divider className={classes.divider} />
      <Grid item xs={4}>
        <Typography variant='body1'>Amount</Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant='body1'>
          {amountZec} ZEC (${amountUsd} USD)
        </Typography>
      </Grid>
      <Divider className={classes.divider} />
      <Grid item xs={4}>
        <Typography variant='body1'>Fee</Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant='body1'>${feeUsd.toFixed(4).toString()}</Typography>
      </Grid>
      <Divider className={classes.divider} />
      <Grid item xs={4}>
        <Typography variant='body1'>Note</Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant='body1'>{memo}</Typography>
      </Grid>
      <Divider className={classes.divider} />
      <Grid item xs={4}>
        <Typography variant='body1'>Total</Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography variant='body1'>
          {parseFloat(amountZec) + feeZec} ZEC (${(parseFloat(amountUsd) + feeUsd).toFixed(4)} USD)
        </Typography>
      </Grid>
      {!(step === 4) && (
        <Grid item xs={12}>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
              submitForm()
              setStep(step + 1)
            }}
            fullWidth
            className={classes.button}
          >
            Confirm
          </Button>
        </Grid>
      )}
    </Grid>
  )
}

SendMoneyTransactionDetails.propTypes = {
  classes: PropTypes.object.isRequired,
  recipient: PropTypes.string.isRequired,
  amountUsd: PropTypes.string.isRequired,
  amountZec: PropTypes.string.isRequired,
  memo: PropTypes.string.isRequired,
  feeUsd: PropTypes.number.isRequired,
  feeZec: PropTypes.number.isRequired,
  submitForm: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  step: PropTypes.number.isRequired
}

SendMoneyTransactionDetails.defaultProps = {}

export default withStyles(styles)(SendMoneyTransactionDetails)
