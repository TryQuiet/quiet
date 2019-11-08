import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Button from '@material-ui/core/Button'

import { TextField } from '../form/TextField'
import { LinkedTextField } from '../form/LinkedTextField'
import { CheckboxWithLabel } from '../form/CheckboxWithLabel'
import ZcashIcon from '../ZcashIcon'

const styles = theme => ({
  root: {
    maxWidth: 600,
    padding: theme.spacing(3)
  },
  textBetweenInputsItem: {
    width: '100%',
    textAlign: 'center',
    marginTop: theme.spacing(2)
  },
  textBetweenInputs: {
    fontSize: `1.3rem`
  },
  button: {
    backgroundColor: theme.palette.colors.zbayBlue,
    padding: theme.spacing(2)
  },
  field: {
    padding: theme.spacing(1),
    boxSizing: 'border-box'
  },
  balance: {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: '4px',
    borderColor: 'rgba(0,0,0,0.23)',
    padding: theme.spacing(1) + 14
  },
  value: {
    marginLeft: '5px',
    fontSize: `1rem`,
    marginTop: '2px'
  },
  balanceZec: {
    fontSize: '1rem'
  },
  balanceUsd: {
    fontSize: '0.9rem'
  }
})

export const SendMoneyForm = ({
  classes,
  balanceZec,
  step,
  setStep,
  rateZec,
  rateUsd,
  isValid,
  values,
  shippingData
}) => {
  return (
    <Grid container className={classes.root} spacing={2}>
      <Grid item xs={12}>
        <Typography variant='body1'>Recipient</Typography>
        <TextField
          name='recipient'
          placeholder='Enter Zcash Address'
          InputProps={{ className: classes.field }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant='body1'>Available to send</Typography>
        <Grid
          container
          justify='space-between'
          alignItems='center'
          className={classNames(classes.balance, classes.field)}
        >
          <Grid item xs={4} className={classes.balanceField}>
            <Grid container alignItems='center'>
              <ZcashIcon size={20} />
              <Typography variant='h6' className={classes.value}>
                Zcash Wallet
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={4}>
            <Grid container direction='column' justify='center' alignItems='flex-end'>
              <Grid item xs={12}>
                <Typography variant='h6' className={classes.balanceZec}>
                  {balanceZec.toString()} ZEC
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='caption' className={classes.balanceUsd}>
                  $
                  {balanceZec
                    .times(rateUsd)
                    .toFixed(4)
                    .toString()}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography variant='body1'>Amount</Typography>
        <Grid container justify='space-between'>
          <Grid item xs={5}>
            <LinkedTextField
              name='amountZec'
              otherField='amountUsd'
              placeholder='0.00'
              transformer={rateUsd}
              InputProps={{
                className: classes.field,
                endAdornment: <InputAdornment position='end'>ZEC</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={2} className={classes.textBetweenInputsItem}>
            <Typography className={classes.textBetweenInputs} variant='caption'>
              OR
            </Typography>
          </Grid>
          <Grid item xs={5}>
            <LinkedTextField
              name='amountUsd'
              otherField='amountZec'
              placeholder='0.00'
              transformer={rateZec}
              InputProps={{
                className: classes.field,
                endAdornment: <InputAdornment position='end'>USD</InputAdornment>
              }}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography variant='body1'>Memo</Typography>
        <TextField
          name='memo'
          placeholder={
            values.recipient.length === 35
              ? `You can't include message to transparent address`
              : 'Enter an optional message'
          }
          InputProps={{ className: classes.field }}
          disabled={values.recipient.length === 35}
        />
        <Typography variant='body1' />
      </Grid>
      <Grid item xs={12}>
        <CheckboxWithLabel
          color='primary'
          name='shippingInfo'
          label='Include my shipping info'
          disabled={R.isEmpty(shippingData)}
        />
        {R.isEmpty(shippingData) && (
          <Typography> Please fill your shipping information if you want to include it.</Typography>
        )}
      </Grid>
      <Grid item xs={12}>
        <Button
          color='primary'
          variant='contained'
          onClick={() => setStep(step + 1)}
          fullWidth
          className={classes.button}
          disabled={!isValid}
        >
          Continue
        </Button>
      </Grid>
    </Grid>
  )
}

SendMoneyForm.propTypes = {
  classes: PropTypes.object.isRequired,
  balanceZec: PropTypes.instanceOf(BigNumber).isRequired,
  step: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  rateZec: PropTypes.instanceOf(BigNumber).isRequired,
  rateUsd: PropTypes.instanceOf(BigNumber).isRequired,
  isValid: PropTypes.bool.isRequired
}

SendMoneyForm.defaultProps = {}

export default withStyles(styles)(SendMoneyForm)
