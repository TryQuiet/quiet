import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import InputAdornment from '@material-ui/core/InputAdornment'

import Modal from '../Modal'
import Icon from '../Icon'
import exclamationMark from '../../../static/images/exclamationMark.svg'
import exchange from '../../../static/images/zcash/exchange.svg'
import CheckboxWithLabel from '../form/CheckboxWithLabel'
import LinkedTextField from '../form/LinkedTextField'
import LoadindButton from '../LoadingButton'

const reqSvgs = require && require.context('../../ui/assets/backgrounds', true, /\.svg$/)

const styles = theme => ({
  root: {
  },
  window: {
    width: 440,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  userBox: {
    padding: '0px 20px',
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`,
    height: 64
  },
  hash: {
    opacity: 0.6
  },
  backgroundImage: {
    width: 64,
    height: 36,
    borderRadius: 4
  },
  nickname: {
    fontWeight: 500
  },
  offerOwner: {
    marginLeft: 16
  },
  tag: {
    color: theme.palette.colors.darkGray
  },
  warningBox: {
    marginTop: '16px',
    padding: '16px 24px',
    height: 240,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  icon: {
    width: 60,
    height: 60,
    justifyContent: 'center'
  },
  exclamationMarkIcon: {
    width: 26,
    height: 23,
    justifyContent: 'center'
  },
  wrapper: {
    padding: '0px 20px'
  },
  sellerInfo: {
    marginTop: 7,
    height: 174
  },
  description: {
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: theme.palette.colors.darkGray
  },
  checkboxLabel: {
    marginLeft: -6,
    lineHeight: '24px',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal'
  },
  shipping: {
    marginTop: 32,
    padding: '0px 20px'
  },
  address: {
    paddingLeft: 23,
    color: theme.palette.colors.darkGray,
    fontSize: 12,
    lineHeight: '20px',
    letterSpacing: '0.4px'
  },
  divMoney: {
    padding: '0px 20px',
    width: '100%',
    marginTop: 16,
    marginBottom: 32,
    minHeight: 42,
    '& .MuiFormHelperText-contained': {
      display: 'none'
    }
  },
  moneyDiv: {
    width: 180
  },
  moneyInput: {
    height: 42,
    '& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      display: 'none'
    }
  },
  inputMark: {
    color: theme.palette.colors.darkGray
  },
  exchangeDiv: {
    width: 40
  },
  titleBox: {
    fontStyle: 'normal',
    fontWeight: 'normal',
    marginBottom: 9
  },
  postButton: {
    '&:disabled': {
      color: theme.palette.colors.white
    },
    maxWidth: 400
  },
  divButton: {
    marginTop: 32,
    marginBottom: 24,
    padding: '0px 20px'
  },
  errorBox: {
    width: 400,
    height: 92,
    borderRadius: 4,
    marginTop: 24,
    padding: '16px 24px',
    backgroundColor: theme.palette.colors.veryLightGray
  },
  addFounds: {
    color: theme.palette.colors.linkBlue
  },
  error: {
    color: theme.palette.colors.red
  },
  exchange: {}
})

export const SendFundsModal = ({
  classes,
  open,
  handleClose,
  values,
  payload,
  rateZec,
  rateUsd,
  errors,
  touched,
  submitForm,
  balanceZec,
  isValid,
  shippingData
}) => {
  const { zec: zecOffer } = values
  const hasNoFounds = balanceZec.lt(zecOffer)
  const ErrorText = ({ name }) => {
    return errors[name] && touched[name] ? (
      <Grid item xs className={classes.error}>
        <Typography variant='caption'>{errors[name]}</Typography>
      </Grid>
    ) : (
      <span />
    )
  }
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      classes={{ window: classes.window }}
      title='Send Funds'
      fullPage
    >
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars autoHideTimeout={500} style={{ width: width, height: height }}>
            <Grid container direction='column' className={classes.root}>
              <Grid container item className={classes.userBox} direction={'row'} justify={'flex-start'} alignItems={'center'} wrap={'nowrap'}>
                <Grid container className={classes.backgroundImage} style={{ background: `url(${reqSvgs(reqSvgs.keys()[payload.background])})` }} />
                <Grid className={classes.offerOwner} container item direction={'column'}>
                  <Grid item>
                    <Typography className={classes.nickname} variant={'subtitle1'}>{payload.offerOwner}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography className={classes.tag} variant={'caption'}><span className={classes.hash}>#</span>{payload.tag}</Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid className={classes.wrapper} container item>
                <Grid container className={classes.warningBox} item dircetion={'column'}>
                  <Grid container direction={'row'} justify={'space-between'}>
                    <Grid item>
                      <Typography variant={'h4'}>Warning</Typography>
                    </Grid>
                    <Grid item>
                      <Icon className={classes.exclamationMarkIcon} src={exclamationMark} />
                    </Grid>
                  </Grid>
                  <Grid container item className={classes.sellerInfo}>
                    <Grid item>
                      <Typography className={classes.description} variant={'body2'}>This is a strong warning with a link to Google the seller's zcash address for reviews and feedback. You can also check the following:</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container item className={classes.shipping} direction={'column'}>
                <Grid item>
                  <CheckboxWithLabel
                    color='primary'
                    name='shippingInfo'
                    label='Include shipping address'
                    labelClass={classes.checkboxLabel}
                  />
                </Grid>
                <Grid item>
                  <Typography variant={'caption'} className={classes.address}>{shippingData.street}</Typography>
                </Grid>
                <Grid item>
                  <Typography variant={'caption'} className={classes.address}>{`${shippingData.city} ${shippingData.postalCode}
                  ${shippingData.region} ${shippingData.country}`}</Typography>
                </Grid>
              </Grid>
              <Grid item xs container className={classes.divMoney}>
                <Grid className={classes.titleBox} item xs={12}>
                  <Typography variant={'body2'}>Amount to send</Typography>
                </Grid>
                <Grid item className={classes.moneyDiv}>
                  <LinkedTextField
                    name='usd'
                    type='number'
                    placeholder='0.00'
                    fullWidth
                    otherField='zec'
                    transformer={rateZec}
                    InputProps={{
                      error: errors['zec'] && touched['zec'],
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
                    name='zec'
                    type='number'
                    placeholder='0.00'
                    fullWidth
                    otherField='usd'
                    transformer={rateUsd}
                    InputProps={{
                      error: errors['usd'] && touched['usd'],
                      endAdornment: (
                        <InputAdornment position='end'>
                          <span className={classes.inputMark}>ZEC</span>
                        </InputAdornment>
                      ),
                      className: classes.moneyInput
                    }}
                  />
                </Grid>
                <ErrorText name={'usd'} />
              </Grid>
              {hasNoFounds && (
                <Grid container item className={classes.wrapper} direction={'column'}>
                  <Grid container item className={classes.errorBox}>
                    <Grid container direction={'row'} justify={'space-between'}>
                      <Grid item>
                        <Typography variant={'h4'}>Not enough fund</Typography>
                      </Grid>
                      <Grid item>
                        <Icon className={classes.exclamationMarkIcon} src={exclamationMark} />
                      </Grid>
                    </Grid>
                    <Grid container item>
                      <Grid item>
                        <Typography variant={'body2'} className={classes.description}>You don’t have enough funds. <span className={classes.addFounds}>Add funds now.</span></Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}
              <Grid item xs className={classes.divButton}>
                <LoadindButton
                  color='primary'
                  variant='contained'
                  fullWidth
                  size='large'
                  margin='normal'
                  onClick={submitForm}
                  disabled={hasNoFounds || !isValid}
                  text={
                    <>
                    Send Funds
                    </>
                  }
                  classes={{ button: classes.postButton }}
                />
              </Grid>
            </Grid>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}
SendFundsModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  submitForm: PropTypes.func.isRequired,
  rateUsd: PropTypes.object.isRequired,
  rateZec: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  isValid: PropTypes.bool.isRequired,
  balanceZec: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  payload: PropTypes.object.isRequired,
  shippingData: PropTypes.object.isRequired
}

SendFundsModal.defaultProps = {
  payload: {
    title: '',
    zec: '',
    usd: '',
    description: '',
    shippingInfo: false,
    background: 2,
    tag: ''
  }
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SendFundsModal)
