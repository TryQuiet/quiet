import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Collapse from '@material-ui/core/Collapse'
import Button from '@material-ui/core/Button'
import InputAdornment from '@material-ui/core/InputAdornment'
import { withStyles } from '@material-ui/core/styles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Badge } from '@material-ui/core'

import LoadingButton from '../LoadingButton'

import { TextField } from '../form/TextField'
import LinkedTextField from '../form/LinkedTextField'
import CheckboxWithLabel from '../form/CheckboxWithLabel'
import exchange from '../../../static/images/zcash/exchange.svg'
import Modal from '../Modal'
import Icon from '../Icon'
import { getBytesSize } from '../../../../shared/helpers'

const reqSvgs =
  require && require.context('../assets/backgrounds', true, /\.svg$/)

const styles = theme => {
  return {
    window: {
      width: 570,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    },
    root: {
      paddingLeft: 85,
      paddingRight: 85,
      paddingTop: 40,
      paddingBottom: 40
    },

    backgroundDiv: {
      height: 225,
      width: 400,
      position: 'relative'
    },
    titleField: {
      background: 'rgba(0,0,0,0.6)',
      borderRadius: 4,
      minWidth: 100,
      maxWidth: 300,
      '& .MuiFormHelperText-contained': {
        display: 'none'
      }
    },
    field: {
      fontSize: 28,
      color: 'white',
      fontWeight: 500,
      paddingTop: 5,
      paddingBottom: 5
    },
    hash: {
      fontSize: 28,
      fontWeight: 500,
      opacity: 0.6
    },
    selectField: {
      width: '100%',
      marginTop: 16
    },
    button: {
      height: 60,
      textTransform: 'none'
    },
    selectIconBackground: {
      width: 64,
      height: 34,
      borderRadius: 4
    },
    downIcon: {
      marginTop: 15
    },
    selectIconBackgroundDiv: {
      marginTop: 7,
      marginRight: 5
    },
    selectDiv: {
      paddingLeft: 16,
      paddingRight: 16
    },
    backgroundElement: {
      margin: 4
    },
    titleDiv: {
      height: 42
    },
    descriptionDiv: {
      marginTop: 16
    },
    div: {
      width: '100%',
      marginTop: 16,
      '& .MuiFormHelperText-contained': {
        display: 'none'
      }
    },
    divMoney: {
      width: '100%',
      marginTop: 16,
      minHeight: 42,
      '& .MuiFormHelperText-contained': {
        display: 'none'
      }
    },
    moneyDiv: {
      width: 180
    },
    moneyInput: {
      height: 42
    },
    inputMark: {
      color: theme.palette.colors.darkGray
    },
    exchangeDiv: {
      width: 40
    },
    checkbox: {
      margin: 0,
      padding: 0
    },
    checkboxLabel: {
      marginLeft: 5,
      fontSize: 14
    },
    postButton: {
      maxWidth: 400
    },
    disableButton: {
      maxWidth: 400,
      backgroundColor: theme.palette.colors.darkGray
    },
    postLabel: {
      fontSize: 16,
      color: theme.palette.colors.white
    },
    postLabelGray: {
      color: theme.palette.colors.white,
      fontSize: 16,
      marginLeft: 5,
      opacity: 0.6
    },
    costInfo: {
      fontSize: 12,
      color: theme.palette.colors.darkGray
    },
    badge: {
      position: 'absolute',
      bottom: 16,
      right: 16
    },
    primaryBadge: {
      backgroundColor: 'black !important'
    },
    error: {
      marginTop: 8,
      color: theme.palette.colors.red
    },
    fieldError: {
      height: 0,
      width: 0
    }
  }
}

export const AdvertModal = ({
  classes,
  open,
  handleClose,
  rateUsd,
  rateZec,
  values,
  setFieldValue,
  isValid,
  balanceZec,
  touched,
  errors,
  submitForm,
  sending,
  minFee
}) => {
  const [inputWidth, setInputWidth] = React.useState(80)
  const [colapse, setColapse] = React.useState(false)
  const funds = balanceZec.gt(minFee)
  const valid = isValid && funds
  const ErrorText = ({ name }) => {
    return errors[name] && touched[name] ? (
      <Grid item xs className={classes.error}>
        <Typography variant='body2'>{errors[name]}</Typography>
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
      title='New Listing'
      fullPage
      alignCloseLeft
    >
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars
            autoHideTimeout={500}
            style={{ width: width, height: height }}
          >
            <Grid container direction='column' className={classes.root}>
              <Grid
                item
                container
                justify='center'
                alignItems='center'
                className={classes.backgroundDiv}
                style={{
                  background: `url(${reqSvgs(
                    reqSvgs.keys()[values.background]
                  )})`
                }}
              >
                <Badge
                  color='primary'
                  badgeContent={9 - getBytesSize(values.tag)}
                  invisible={values.tag.length === 0}
                  classes={{
                    root: classes.badge,
                    colorPrimary: classes.primaryBadge
                  }}
                  anchorOrigin={{
                    horizontal: 'right',
                    vertical: 'bottom'
                  }}
                />
                <Grid item>
                  <TextField
                    name='tag'
                    placeholder='tag'
                    className={classes.titleField}
                    style={{ width: inputWidth }}
                    inputProps={{ className: classes.field }}
                    InputProps={{
                      classes: {
                        root: classes.field
                      },
                      onChange: e => {
                        if (getBytesSize(e.target.value) < 10) {
                          setInputWidth(80 + getBytesSize(e.target.value) * 15)
                          setFieldValue('tag', e.target.value)
                        }
                      },
                      startAdornment: (
                        <InputAdornment position='start'>
                          <span className={classes.hash}>#</span>
                        </InputAdornment>
                      ),
                      disableUnderline: true
                    }}
                  />
                </Grid>
              </Grid>
              <ErrorText name='tag' />
              <Grid item xs className={classes.selectField}>
                <Button
                  fullWidth
                  variant='outlined'
                  onClick={() => {
                    setColapse(!colapse)
                  }}
                  className={classes.button}
                >
                  <Grid container direction='row' alignItems='center'>
                    <Grid item xs container justify='flex-start'>
                      <Typography variant='body2'>
                        Choose a background
                      </Typography>
                    </Grid>
                    <Grid item xs container justify='flex-end'>
                      <Grid item className={classes.selectIconBackgroundDiv}>
                        <Icon
                          className={classes.selectIconBackground}
                          src={reqSvgs(reqSvgs.keys()[values.background])}
                        />
                      </Grid>
                      <Grid item className={classes.downIcon}>
                        <ExpandMoreIcon fontSize='small' />
                      </Grid>
                    </Grid>
                  </Grid>
                </Button>
                <Collapse in={colapse} timeout='auto' unmountOnExit>
                  <Grid container direction='row' className={classes.selectDiv}>
                    {reqSvgs.keys().map(key => (
                      <Grid
                        item
                        key={key}
                        onClick={() => {
                          setFieldValue(
                            'background',
                            reqSvgs.keys().indexOf(key)
                          )
                          setColapse(!colapse)
                        }}
                        className={classes.backgroundElement}
                      >
                        <Icon
                          className={classes.selectIconBackground}
                          src={reqSvgs(key)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
              </Grid>
              <Grid item xs className={classes.div}>
                <TextField
                  error
                  InputProps={{ className: classes.titleDiv }}
                  name='title'
                  placeholder='Title'
                />
              </Grid>
              <ErrorText name='title' />

              <Grid item xs className={classes.div}>
                <TextField
                  name='description'
                  placeholder='Description'
                  multiline
                  fullWidth
                  rows={5}
                />
              </Grid>
              <ErrorText name='description' />

              <Grid item xs container className={classes.divMoney}>
                <Grid item className={classes.moneyDiv}>
                  <LinkedTextField
                    name='usd'
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
                  <Icon src={exchange} />
                </Grid>
                <Grid item className={classes.moneyDiv}>
                  <LinkedTextField
                    name='zec'
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
              </Grid>
              <ErrorText name='usd' />

              <Grid item xs className={classes.div}>
                <CheckboxWithLabel
                  color='primary'
                  name='shippingInfo'
                  label='Buyer must provide shipping information'
                  labelClass={classes.checkboxLabel}
                  classes={{ root: classes.checkbox }}
                />
              </Grid>
              <Grid item xs className={classes.div}>
                <LoadingButton
                  color='primary'
                  variant='contained'
                  fullWidth
                  size='large'
                  margin='normal'
                  onClick={submitForm}
                  inProgress={sending}
                  text={
                    <>
                      <span className={classes.postLabel}>Post </span>
                      <span className={classes.postLabelGray}>{`($${(
                        rateUsd * minFee
                      ).toFixed(2)} USD)`}</span>
                    </>
                  }
                  disabled={!valid || sending}
                  classes={{ button: classes.postButton }}
                />
              </Grid>
              {!funds && (
                <Grid item xs className={classes.error}>
                  <Typography variant='body2'>{`You don't have enough funds`}</Typography>
                </Grid>
              )}
              <Grid item xs className={classes.error}>
                <Typography variant='caption' className={classes.costInfo}>
                  {`The price of posting an ad is $${(rateUsd * minFee).toFixed(
                    2
                  )} USD (${minFee.toFixed(4)} ZEC).`}
                </Typography>
              </Grid>
            </Grid>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}
AdvertModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  submitForm: PropTypes.func.isRequired,
  rateUsd: PropTypes.object.isRequired,
  rateZec: PropTypes.number.isRequired,
  values: PropTypes.object.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  isValid: PropTypes.bool.isRequired,
  balanceZec: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  sending: PropTypes.bool.isRequired,
  minFee: PropTypes.number.isRequired
}
export default R.compose(React.memo, withStyles(styles))(AdvertModal)
