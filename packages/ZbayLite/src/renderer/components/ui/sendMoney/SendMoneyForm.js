import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { withStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import Button from '@material-ui/core/Button'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Icon from '../Icon'
import { TextField } from '../form/TextField'
import { LinkedTextField } from '../form/LinkedTextField'
import { CheckboxWithLabel } from '../form/CheckboxWithLabel'
import exchange from '../../../static/images/zcash/exchange.svg'

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
    width: 140,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    padding: theme.spacing(2)
  },
  field: {
    height: 60,
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
  },
  title: {
    marginTop: 32,
    marginBottom: 24
  },
  fieldTitle: {
    fontSize: 12,
    lineHeight: '14px',
    color: theme.palette.colors.black30,
    marginBottom: 6
  },
  divMoney: {
    padding: '0px 20px',
    width: '100%',
    marginTop: 16,
    marginBottom: 4,
    minHeight: 42,
    '& .MuiFormHelperText-contained': {
      display: 'none'
    }
  },
  moneyDiv: {
    width: 248
  },
  moneyInput: {
    height: 60,
    '& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      display: 'none'
    }
  },
  disabledInput: {
    height: 60,
    '& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      display: 'none'
    },
    backgroundColor: theme.palette.colors.veryLightGray
  },
  inputMark: {
    color: theme.palette.colors.darkGray
  },
  exchangeDiv: {
    width: 40
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: '24px'
  },
  shippingDataInfo: {
    marginLeft: 32,
    fontSize: 12,
    lineHeight: '18px'
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  error: {
    color: theme.palette.colors.red
  }
})
const handleOpenAddShippingData = (openSettingsModal, openShippingTab, handleClose) => {
  handleClose()
  openShippingTab()
  openSettingsModal()
}

export const SendMoneyForm = ({
  classes,
  balanceZec,
  step,
  setStep,
  rateZec,
  rateUsd,
  isValid,
  values,
  shippingData,
  touched,
  openShippingTab,
  openSettingsModal,
  handleClose,
  errors
}) => {
  const ErrorText = ({ name }) => {
    return errors[name] ? (
      <Grid item xs className={classes.error}>
        <Typography variant='caption'>{errors[name]}</Typography>
      </Grid>
    ) : (
      <span />
    )
  }
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
          <Grid container className={classes.root} spacing={2}>
            <Grid className={classes.title} item xs={12}>
              <Typography variant='h3'>Send Funds</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography className={classes.fieldTitle} variant='body1'>
                Recipient
              </Typography>
              <TextField
                name='recipient'
                placeholder='Enter Zcash Address'
                InputProps={{ className: classes.field }}
              />
            </Grid>
            <Grid item xs={12} container className={classes.divMoney}>
              <Grid className={classes.titleBox} item xs={12}>
                <Typography className={classes.fieldTitle} variant={'body2'}>
                  Available to send
                </Typography>
              </Grid>
              <Grid item className={classes.moneyDiv}>
                <LinkedTextField
                  name='disabledValueUsd'
                  placeholder={balanceZec.times(rateUsd).toFixed(2)}
                  fullWidth
                  disabled
                  otherField='zec'
                  transformer={rateZec}
                  InputProps={{
                    error: errors['zec'] && touched['zec'],
                    endAdornment: (
                      <InputAdornment position='end'>
                        <span className={classes.inputMark}>USD</span>
                      </InputAdornment>
                    ),
                    className: classes.disabledInput
                  }}
                />
              </Grid>
              <Grid
                item
                container
                alignItems='center'
                justify='center'
                className={classes.exchangeDiv}
              >
                <Icon className={classes.exchnage} src={exchange} />
              </Grid>
              <Grid item className={classes.moneyDiv}>
                <LinkedTextField
                  name='disabelValueZec'
                  placeholder={balanceZec.toFixed(4)}
                  fullWidth
                  disabled
                  otherField='usd'
                  transformer={rateUsd}
                  InputProps={{
                    error: errors['usd'] && touched['usd'],
                    endAdornment: (
                      <InputAdornment position='end'>
                        <span className={classes.inputMark}>ZEC</span>
                      </InputAdornment>
                    ),
                    className: classes.disabledInput
                  }}
                />
              </Grid>
            </Grid>
            <Grid item xs={12} container className={classes.divMoney}>
              <Grid className={classes.titleBox} item xs={12}>
                <Typography className={classes.fieldTitle} variant={'body2'}>
                  Amount to send
                </Typography>
              </Grid>
              <Grid item className={classes.moneyDiv}>
                <LinkedTextField
                  name='amountUsd'
                  type='number'
                  placeholder='0.00'
                  fullWidth
                  otherField='amountZec'
                  transformer={rateZec}
                  precise={4}
                  InputProps={{
                    error: errors['amountZec'] && touched['amountZec'],
                    endAdornment: (
                      <InputAdornment position='end'>
                        <span className={classes.inputMark}>USD</span>
                      </InputAdornment>
                    ),
                    className: classes.moneyInput
                  }}
                />
              </Grid>
              <Grid
                item
                container
                alignItems='center'
                justify='center'
                className={classes.exchangeDiv}
              >
                <Icon className={classes.exchnage} src={exchange} />
              </Grid>
              <Grid item className={classes.moneyDiv}>
                <LinkedTextField
                  name='amountZec'
                  type='number'
                  placeholder='0.00'
                  fullWidth
                  otherField='amountUsd'
                  transformer={rateUsd}
                  precise={2}
                  InputProps={{
                    error: errors['amountUsd'] && touched['amountUsd'],
                    endAdornment: (
                      <InputAdornment position='end'>
                        <span className={classes.inputMark}>ZEC</span>
                      </InputAdornment>
                    ),
                    className: classes.moneyInput
                  }}
                />
              </Grid>
              <ErrorText name={'amountZec'} />
            </Grid>
            <Grid item xs={12}>
              <Typography className={classes.fieldTitle} variant='body1'>
                Memo
              </Typography>
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
                labelClass={classes.checkboxLabel}
              />
              {R.isEmpty(shippingData) && (
                <Typography className={classes.shippingDataInfo}>
                  {' '}
                  Please{' '}
                  <span
                    onClick={() =>
                      handleOpenAddShippingData(openSettingsModal, openShippingTab, handleClose)
                    }
                    className={classes.link}
                  >
                    fill your shipping information{' '}
                  </span>{' '}
                  if you want to include it.
                </Typography>
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
        </Scrollbars>
      )}
    </AutoSizer>
  )
}

SendMoneyForm.propTypes = {
  classes: PropTypes.object.isRequired,
  balanceZec: PropTypes.instanceOf(BigNumber).isRequired,
  step: PropTypes.number.isRequired,
  setStep: PropTypes.func.isRequired,
  rateZec: PropTypes.number.isRequired,
  rateUsd: PropTypes.number.isRequired,
  isValid: PropTypes.bool.isRequired,
  values: PropTypes.object.isRequired,
  shippingData: PropTypes.object.isRequired,
  touched: PropTypes.bool.isRequired,
  errors: PropTypes.object.isRequired
}

SendMoneyForm.defaultProps = {}

export default withStyles(styles)(SendMoneyForm)
