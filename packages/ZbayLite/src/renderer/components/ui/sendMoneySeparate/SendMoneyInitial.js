import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { DateTime } from 'luxon'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import { Field } from 'formik'
import InputAdornment from '@material-ui/core/InputAdornment'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import BigNumber from 'bignumber.js'

import Icon from '../Icon'
import { LinkedTextField } from '../form/LinkedTextField'
import FormikTextField from '../../../components/ui/form/TextField'
import exchange from '../../../static/images/zcash/exchange.svg'
import ZecIcon from '../../../static/images/circle-zec.svg'
import radioChecked from '../../../static/images/radioChecked.svg'
import radioUnselected from '../../../static/images/radioUnselected.svg'
import { AutocompleteField } from '../../ui/form/Autocomplete'

const styles = theme => ({
  root: {
    padding: 32,
    height: '100%',
    width: '100%'
  },
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  gutter: {
    marginBottom: 16,
    marginTop: 0
  },
  button: {
    marginTop: 24,
    width: 139,
    height: 60,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  title: {
    marginBottom: 24
  },
  bold: {
    fontWeight: 'bold'
  },
  radioContainer: {
    marginBottom: 5
  },
  infoBox: {
    width: '100%',
    backgroundColor: theme.palette.colors.gray03,
    padding: '12px 16px',
    borderRadius: 4,
    marginTop: 18,
    marginBottom: 24
  },
  typo: {
    letterSpacing: '0.4 px',
    fontSize: 12,
    lineHeight: '18px',
    color: theme.palette.colors.black
  },
  fieldTitle: {
    fontSize: 12,
    lineHeight: '14px',
    color: theme.palette.colors.black30,
    marginBottom: 6
  },
  divMoney: {
    padding: 0,
    width: '100%',
    marginBottom: 24,
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
  zecIcon: {
    width: 32,
    height: 32,
    padding: 0,
    margin: 0
  },
  rootClass: {
    height: 24
  },
  avaiableBox: {
    width: '100%',
    height: 86,
    borderRadius: 4,
    border: `1px solid ${theme.palette.colors.gray50}`
  },
  contentContainer: {
    width: 536
  },
  innerBox: {
    padding: '0px 16px'
  },
  zecTypo: {
    marginLeft: 16,
    textTransform: 'uppercase',
    fontSize: 12,
    lineHeight: '14px',
    color: theme.palette.colors.trueBlack
  },
  valueZec: {
    fontWeight: 'normal',
    color: theme.palette.colors.trueBlack
  },
  valueUsd: {
    fontWeight: 'normal',
    color: theme.palette.colors.darkGray,
    lineHeight: '20px'
  },
  fieldName: {
    fontSize: 12,
    lineHeight: '14px',
    color: theme.palette.colors.black30,
    marginBottom: 6
  },
  radioLabel: {
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.colors.trueBlack,
    margin: 0,
    marginLeft: 10,
    cursor: 'pointer'
  },
  radioIcon: {
    width: 16,
    height: 16,
    margin: 0
  },
  recipientInfo: {
    marginBottom: 10
  },
  spacing: {
    marginBottom: 12
  },
  error: {
    marginTop: 5,
    color: theme.palette.colors.red
  }
})
export const SendMoneyInitial = ({
  classes,
  handleClose,
  users,
  setFieldValue,
  values,
  nickname,
  balanceZec,
  rateZec,
  rateUsd,
  isValid,
  touched,
  resetForm,
  errors,
  submitForm,
  amountZec,
  amountUsd,
  feeUsd,
  feeZec,
  memo,
  openSentFundsModal
}) => {
  const title = 'Funds sent'
  const usersArray = users.toList().toJS()
  const { recipient } = values
  const userNamesArray = usersArray.map(user => user.nickname)
  const isUserSelected = userNamesArray.includes(recipient)
  const ErrorText = ({ name }) => {
    return errors[name] ? (
      <Typography className={classes.error} variant='caption'>
        {errors[name]}
      </Typography>
    ) : (
      <span />
    )
  }
  return (
    <Grid
      container
      justify='flex-start'
      direction='column'
      className={classes.contentContainer}
    >
      <Typography variant='h3' className={classes.title}>
        Send funds
      </Typography>
      <Typography variant='body2' className={classes.fieldName}>
        Recipient
      </Typography>
      <AutocompleteField
        freeSolo
        name={'recipient'}
        inputValue={values.recipient || ''}
        options={usersArray.map(option => option.nickname)}
        filterOptions={(options, state) =>
          options.filter(o =>
            o.toLowerCase().includes(values.recipient || ''.toLowerCase())
          )
        }
        value={values.recipient}
        onChange={(e, v) => {
          if (v && (v.length === 35 || v.length === 78)) {
            setFieldValue('shouldIncludeMeta', 'no')
          }
          setFieldValue('recipient', v)
        }}
        onInputChange={(e, v) => {
          if (v && (v.length === 35 || v.length === 78)) {
            setFieldValue('shouldIncludeMeta', 'no')
          }
          setFieldValue('recipient', v)
        }}
        renderInput={params => (
          <TextField
            {...params}
            className={classes.gutter}
            variant='outlined'
            multiline
            placeholder={`Enter Zbay username or Zcash address`}
            margin='normal'
            fullWidth
          />
        )}
      />
      <ErrorText name={'recipient'} />
      {isUserSelected && (
        <Grid container direction={'column'} item>
          <Grid className={classes.recipientInfo} item>
            <Typography variant='body2'>
              {`Tell recipient it's from `}
              <span className={classes.bold}>{nickname}</span>?
            </Typography>
          </Grid>
          <Grid item className={classes.radioContainer}>
            <Field
              name='shouldIncludeMeta'
              render={({ field }) => {
                return (
                  <Grid container direction={'column'} item>
                    <Grid item className={classes.spacing}>
                      <FormControlLabel
                        classes={{ root: classes.radioIcon }}
                        control={
                          <Checkbox
                            name={'radio-yes'}
                            className={classes.radioIcon}
                            icon={<Icon src={radioUnselected} />}
                            checkedIcon={<Icon src={radioChecked} />}
                            checked={values.shouldIncludeMeta === 'yes'}
                          />
                        }
                        onChange={() =>
                          setFieldValue('shouldIncludeMeta', 'yes')
                        }
                        label={
                          <label
                            className={classes.radioLabel}
                            onClick={() =>
                              setFieldValue('shouldIncludeMeta', 'yes')
                            }
                            htmlFor='yes'
                          >
                            Yes
                          </label>
                        }
                      />{' '}
                    </Grid>
                    <Grid item>
                      <FormControlLabel
                        classes={{ root: classes.radioIcon }}
                        control={
                          <Checkbox
                            className={classes.radioIcon}
                            name={'radio-no'}
                            icon={<Icon src={radioUnselected} />}
                            checkedIcon={<Icon src={radioChecked} />}
                            checked={values.shouldIncludeMeta === 'no'}
                          />
                        }
                        onChange={() =>
                          setFieldValue('shouldIncludeMeta', 'no')
                        }
                        label={
                          <label
                            className={classes.radioLabel}
                            onClick={() =>
                              setFieldValue('shouldIncludeMeta', 'no')
                            }
                            htmlFor='no'
                          >
                            No
                          </label>
                        }
                      />{' '}
                    </Grid>
                  </Grid>
                )
              }}
            />
          </Grid>
        </Grid>
      )}
      {((values.shouldIncludeMeta && isUserSelected) ||
        (!isUserSelected && !errors.recipient && values.recipient)) && (
        <Grid container item>
          {isUserSelected && values.shouldIncludeMeta === 'no' && (
            <Grid className={classes.infoBox} item>
              <Typography className={classes.typo} variant='body2'>
                <span className={classes.bold}>Warning:</span>
                {` The recipient will not know who it is from, and you may not be able to prove you made the payment`}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} container className={classes.divMoney}>
            <Grid className={classes.titleBox} item xs={12}>
              <Typography className={classes.fieldName} variant={'body2'}>
                Available to send
              </Typography>
            </Grid>
            <Grid
              container
              item
              direction={'row'}
              className={classes.avaiableBox}
              justify={'space-between'}
              wrap={'nowrap'}
            >
              <Grid
                container
                className={classes.innerBox}
                direction={'row'}
                alignItems={'center'}
                item
              >
                <Grid className={classes.zecIcon} item>
                  <Icon src={ZecIcon} />
                </Grid>
                <Grid item>
                  <Typography className={classes.zecTypo} variant='body2'>
                    ZEC
                  </Typography>
                </Grid>
              </Grid>
              <Grid
                container
                className={classes.innerBox}
                direction={'column'}
                justify={'center'}
                alignItems={'flex-end'}
                item
              >
                <Grid item>
                  <Typography className={classes.valueZec} variant='h3'>
                    {balanceZec.toString()}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography
                    className={classes.valueUsd}
                    variant='body2'
                  >{`$${balanceZec.times(rateUsd).toFixed(2)} USD`}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} container className={classes.divMoney}>
            <Grid className={classes.titleBox} item xs={12}>
              <Typography className={classes.fieldName} variant={'body2'}>
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
          {values.recipient.length !== 35 && (
            <Grid item xs={12}>
              <Typography className={classes.fieldName} variant='body1'>
                Memo
              </Typography>
              <FormikTextField
                name='memo'
                placeholder={
                  values.recipient
                    ? values.recipient.length === 35
                      ? `Only shielded Zcash addresses (beginning with a 'z') can receive messages`
                      : 'Enter a message'
                    : 'Enter a message'
                }
                multiline
                rows={8}
                disabled={
                  values.recipient ? values.recipient.length === 35 : false
                }
              />
            </Grid>
          )}
        </Grid>
      )}
      <Button
        className={classes.button}
        onClick={() => {
          submitForm()
          handleClose()
          openSentFundsModal({
            amountZec,
            amountUsd,
            feeUsd,
            feeZec,
            recipient,
            memo,
            title,
            timestamp: DateTime.utc().toSeconds()
          })
        }}
        variant='contained'
        color='primary'
        size='large'
        type='submit'
        disabled={!isValid}
      >
        Send
      </Button>
    </Grid>
  )
}

SendMoneyInitial.propTypes = {
  classes: PropTypes.object.isRequired,
  balanceZec: PropTypes.instanceOf(BigNumber).isRequired,
  rateZec: PropTypes.number,
  rateUsd: PropTypes.instanceOf(BigNumber),
  isValid: PropTypes.bool.isRequired,
  values: PropTypes.object.isRequired,
  touched: PropTypes.object,
  errors: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  nickname: PropTypes.string.isRequired,
  submitForm: PropTypes.func.isRequired,
  feeZec: PropTypes.number,
  feeUsd: PropTypes.number,
  memo: PropTypes.string,
  openSentFundsModal: PropTypes.func.isRequired
}
export default R.compose(React.memo, withStyles(styles))(SendMoneyInitial)
