import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'

const styles = theme => ({
  root: {
    maxWidth: 600,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  },
  title: {
    marginTop: 32,
    marginBottom: 24
  },
  label: {
    padding: 16,
    backgroundColor: theme.palette.colors.gray03,
    width: 145
  },
  fields: {
    borderRadius: 4,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.colors.veryLightGray}`,
    marginBottom: 24
  },
  value: {
    padding: 16,
    wordBreak: 'break-all'
  },
  field: {
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  address: {
    wordBreak: 'break-all'
  },

  buttonBack: {
    width: 140,
    height: 60,
    padding: theme.spacing(2),
    textTransform: 'none',
    color: theme.palette.colors.zbayBlue,
    borderColor: theme.palette.colors.zbayBlue,
    fontWeight: 'normal',
    fontSize: 16,
    lineHeight: '19px'
  },
  buttonConfirm: {
    width: 140,
    height: 60,
    padding: theme.spacing(2),
    textTransform: 'none',
    backgroundColor: theme.palette.colors.zbayBlue,
    fontWeight: 'normal',
    fontSize: 16,
    lineHeight: '19px'
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
    <Grid container className={classes.root}>
      <Grid className={classes.title} item xs={12}>
        <Typography variant='h3'>Confirm ZEC send</Typography>
      </Grid>
      <Grid item className={classes.fields} xs={12}>
        <Grid item container className={classes.field} xs={12}>
          <Grid item className={classes.label}>
            To
          </Grid>
          <Grid item className={classes.value} xs>
            {recipient}
          </Grid>
        </Grid>
        <Grid item container className={classes.field} xs={12}>
          <Grid item className={classes.label}>
            Amount
          </Grid>
          <Grid item className={classes.value} xs>
            {parseFloat(amountZec).toFixed(4)} ZEC ($
            {parseFloat(amountUsd).toFixed(2)} USD)
          </Grid>
        </Grid>
        {feeUsd && (
          <Grid item container className={classes.field} xs={12}>
            <Grid item className={classes.label}>
              Fee
            </Grid>
            <Grid item className={classes.value} xs>
              ${feeUsd.toFixed(4)}
            </Grid>
          </Grid>
        )}
        <Grid item container className={classes.field} xs={12}>
          <Grid item className={classes.label}>
            Note
          </Grid>
          <Grid item className={classes.value} xs>
            {memo}
          </Grid>
        </Grid>
        <Grid item container className={classes.field} xs={12}>
          <Grid item className={classes.label}>
            Total
          </Grid>
          <Grid item className={classes.value} xs>
            {(parseFloat(amountZec) + feeZec).toFixed(4)} ZEC ($
            {(parseFloat(amountUsd) + feeUsd).toFixed(2)} USD)
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} container spacing={2}>
        <Grid item>
          <Button
            color='primary'
            variant='outlined'
            onClick={() => {
              setStep(step - 1)
            }}
            fullWidth
            className={classes.buttonBack}
          >
            Go back
          </Button>
        </Grid>
        <Grid item>
          <Button
            color='primary'
            variant='contained'
            onClick={() => {
              submitForm()
              setStep(step + 1)
            }}
            fullWidth
            className={classes.buttonConfirm}
          >
            Confirm
          </Button>
        </Grid>
      </Grid>
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

SendMoneyTransactionDetails.defaultProps = {
  feeUsd: 0,
  feeZec: 0
}

export default withStyles(styles)(SendMoneyTransactionDetails)
