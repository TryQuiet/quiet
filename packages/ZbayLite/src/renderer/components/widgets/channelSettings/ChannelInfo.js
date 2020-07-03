import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import InputAdornment from '@material-ui/core/InputAdornment'

import TextField from '../../ui/form/TextField'
import CheckboxWithLabel from '../../ui/form/CheckboxWithLabel'
import { LinkedTextField } from '../../ui/form/LinkedTextField'
import Icon from '../../ui/Icon'
import exchange from '../../../static/images/zcash/exchange.svg'

const styles = theme => ({
  submitButton: {},
  label: {
    fontSize: 12,
    color: theme.palette.colors.black30
  },
  button: {
    marginTop: 32,
    height: 60,
    width: 102,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue
  },
  title: {
    marginBottom: 24
  },
  channelDescription: {},
  descriptionDiv: {
    width: '100%'
  },
  checkboxDiv: {
    marginTop: 10
  },
  checkboxLabel: {
    fontSize: 14
  },
  rootClass: {
    marginRight: 0
  },
  divMoney: {
    paddingLeft: 22,
    width: '100%',
    marginTop: 16,
    minHeight: 42,
    '& .MuiFormHelperText-contained': {
      display: 'none'
    }
  },
  moneyDiv: {
    width: 147
  },
  moneyInput: {
    height: 42,
    '& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      display: 'none'
    }
  },
  exchangeDiv: {
    width: 32
  },
  inputMark: {
    color: theme.palette.colors.darkGray
  },
  wrapper: {
    padding: '0px 25px'
  }
})

export const formSchema = Yup.object().shape({
  updateChannelDescription: Yup.string(),
  amountUsd: Yup.number().min(0),
  amountZec: Yup.number()
    .max(1)
    .min(0),
  updateMinFee: Yup.boolean(),
  updateOnlyRegistered: Yup.boolean()
})

export const ChannelInfo = ({
  classes,
  initialValues,
  updateChannelSettings,
  rateZec,
  rateUsd
}) => {
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars
          autoHideTimeout={500}
          style={{ width: width + 50, height: height }}
        >
          <Grid container className={classes.wrapper}>
            <Grid item container>
              <Formik
                onSubmit={updateChannelSettings}
                validationSchema={formSchema}
                initialValues={initialValues}
              >
                {({ values, isSubmitting, errors, isValid }) => {
                  return (
                    <Form className={classes.fullWidth}>
                      <Grid container direction='column' alignItems='flex-start'>
                        <Grid item className={classes.title}>
                          <Typography variant='h3'>Channel Info</Typography>
                        </Grid>
                        <Grid item className={classes.descriptionDiv}>
                          <Typography className={classes.label} variant='body2'>
                          Channel Description
                          </Typography>
                          <TextField
                            name='updateChannelDescription'
                            className={classes.channelDescription}
                            variant='outlined'
                            multiline
                            fullWidth
                            rows={5}
                            value={values.firstName}
                          />
                        </Grid>
                        <Grid item className={classes.checkboxDiv}>
                          <CheckboxWithLabel
                            color='primary'
                            name='updateOnlyRegistered'
                            label='Allow only registered users to send messages'
                            labelClass={classes.checkboxLabel}
                            rootClass={classes.rootClass}
                          />
                        </Grid>
                        <Grid item className={classes.checkboxDiv}>
                          <CheckboxWithLabel
                            color='primary'
                            name='updateMinFee'
                            label='Set the price to post an offer (default is 0.00 ZEC)'
                            labelClass={classes.checkboxLabel}
                            rootClass={classes.rootClass}
                          />
                        </Grid>
                        {values.updateMinFee && (
                          <Grid item container className={classes.divMoney}>
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
                                  error: !!errors['amountZec'],
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
                                  error: !!errors['amountUsd'],
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
                        )}
                        <Grid item className={classes.submitButton}>
                          <Button
                            variant='contained'
                            size='large'
                            color='primary'
                            type='submit'
                            fullWidth
                            disabled={!isValid || isSubmitting}
                            className={classes.button}
                          >
                          Save
                          </Button>
                        </Grid>
                      </Grid>
                    </Form>
                  )
                }}
              </Formik>
            </Grid>
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  )
}
ChannelInfo.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    updateChannelDescription: PropTypes.string.isRequired,
    amountZec: PropTypes.number,
    amountUsd: PropTypes.number,
    updateMinFee: PropTypes.bool.isRequired,
    updateOnlyRegistered: PropTypes.bool.isRequired
  }).isRequired,
  updateChannelSettings: PropTypes.func.isRequired,
  rateZec: PropTypes.number.isRequired,
  rateUsd: PropTypes.number.isRequired
}

ChannelInfo.defaultProps = {
  initialValues: {
    updateChannelDescription: '',
    updateMinFee: false
  }
}
export default withStyles(styles)(ChannelInfo)
