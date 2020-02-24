import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import * as R from 'ramda'
import { Formik } from 'formik'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import BigNumber from 'bignumber.js'
import { withStyles } from '@material-ui/core/styles'
import { Typography, Grid } from '@material-ui/core'

import { TextField } from './form/TextField'
import exclamationMark from '../../static/images/exclamationMark.svg'
import Icon from './Icon'
import Modal from './Modal'
import {
  CHANNEL_DESCRIPTION_SIZE,
  PUBLISH_CHANNEL_NAME_SIZE
} from '../../zbay/transit'
import LoadingButton from './LoadingButton'

const currentNetwork = parseInt(process.env.ZBAY_IS_TESTNET) ? 2 : 1
// import { networkFee } from '../../../../shared/static'

const styles = theme => ({
  warningBox: {
    marginTop: '16px',
    padding: '16px 24px',
    height: 114,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  warrningText: {
    fontSize: 14,
    lineHeight: '24px',
    color: theme.palette.colors.darkGray,
    width: '80%'
  },
  fieldTitle: {
    fontSize: 12,
    lineHeight: '14px',
    color: theme.palette.colors.black30,
    marginBottom: 6
  },
  fieldInfo: {
    marginLeft: 8,
    marginTop: 8,
    fontSize: 12,
    lineHeight: '18px',
    color: theme.palette.colors.darkGray
  },
  spacingFields: {
    marginTop: 24,
    position: 'relative'
  },
  button: {
    width: '100%',
    maxWidth: '100%',
    textTransform: 'none',
    '&:disabled': {
      color: 'rgba(255,255,255,0.5)'
    }
  },
  buttonPrice: {
    color: theme.palette.colors.white,
    opacity: 0.5,
    marginLeft: 5
  },
  counter: {
    position: 'absolute',
    right: 16,
    marginTop: 18,
    fontSize: 14,
    lineHeight: '24px'
  },
  error: {
    color: theme.palette.colors.red,
    fontSize: 14,
    lineHeight: '24px',
    marginTop: 8
  },
  priceInfo: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: '18px',
    color: theme.palette.colors.darkGray
  },
  description: { width: '90%' }
})

export const formSchema = publicChannels =>
  Yup.object().shape(
    {
      name: Yup.string()
        .matches(/^[a-z0-9]+$/, {
          message:
            'Channel name cannot have any spaces or special characters, must be lowercase letters and numbers only',
          excludeEmptyString: true
        })
        .validateName(publicChannels)
        .max(PUBLISH_CHANNEL_NAME_SIZE, 'Channel name is too long')
        .required('Must include a channel name'),
      description: Yup.string().max(
        CHANNEL_DESCRIPTION_SIZE(currentNetwork),
        'Description name is too long'
      )
    },
    ['name', 'description']
  )
const getErrorsFromValidationError = validationError => {
  const FIRST_ERROR = 0
  return validationError.inner.reduce((errors, error) => {
    return {
      ...errors,
      [error.path]: error.errors[FIRST_ERROR]
    }
  }, {})
}
Yup.addMethod(Yup.mixed, 'validateName', function (publicChannels) {
  return this.test(
    'test',
    'Sorry channel name already taken. please choose another',
    function (value) {
      const isNameTaken = publicChannels.get(value)
      return !isNameTaken
    }
  )
})

export const PublishChannelModal = ({
  classes,
  balance,
  handleClose,
  open,
  publicChannelFee,
  zcashRate,
  publicChannels,
  initialValues,
  channel,
  publishChannel
}) => {
  const [sending, setSending] = React.useState(false)
  return (
    <Formik
      enableReinitialize
      onSubmit={async (values, { resetForm }) => {
        setSending(true)
        await publishChannel({
          channelAddress: channel.get('address'),
          channelName: values.name,
          channelDescription: values.description,
          channelIvk: channel.getIn(['keys', 'ivk'])
        })
        setSending(false)
        handleClose()
      }}
      initialValues={initialValues}
      validate={values => {
        try {
          formSchema(publicChannels).validateSync(values, {
            abortEarly: false
          })
          return {}
        } catch (error) {
          return getErrorsFromValidationError(error)
        }
      }}
    >
      {({ values, isValid, handleSubmit }) => {
        return (
          <Modal title={''} open={open} handleClose={handleClose}>
            <AutoSizer>
              {({ width, height }) => (
                <Scrollbars
                  autoHideTimeout={500}
                  style={{ width: width, height: height }}
                >
                  <Grid
                    container
                    justify='flex-start'
                    direction='column'
                    className={classes.fullContainer}
                  >
                    <Grid item>
                      <Typography variant='h3' className={classes.title}>
                        Make Channel Public
                      </Typography>
                    </Grid>
                    <Grid item className={classes.spacingFields}>
                      <Typography
                        variant='body2'
                        className={classes.fieldTitle}
                      >
                        Channel Name
                      </Typography>
                      <TextField
                        name='name'
                        placeholder='Enter a channel name'
                      />
                    </Grid>
                    <Grid item className={classes.spacingFields}>
                      <Typography
                        variant='body2'
                        className={classes.fieldTitle}
                      >
                        Description (Optional)
                      </Typography>
                      <span className={classes.counter}>
                        {CHANNEL_DESCRIPTION_SIZE(currentNetwork) -
                          values.description.length}
                      </span>
                      <TextField
                        multiline
                        name='description'
                        placeholder='Enter a description'
                        InputProps={{
                          classes: { inputMultiline: classes.description }
                        }}
                        rows={4}
                      />
                      <Typography variant='body2' className={classes.fieldInfo}>
                        {CHANNEL_DESCRIPTION_SIZE(currentNetwork)} max characters
                      </Typography>
                    </Grid>
                    <Grid item className={classes.spacingFields}>
                      <Grid
                        container
                        className={classes.warningBox}
                        item
                        dircetion={'column'}
                      >
                        <Grid
                          container
                          direction={'row'}
                          justify={'space-between'}
                        >
                          <Grid item>
                            <Typography variant={'h4'}>Warning</Typography>
                          </Grid>
                          <Grid item>
                            <Icon
                              className={classes.exclamationMarkIcon}
                              src={exclamationMark}
                            />
                          </Grid>
                        </Grid>
                        <Grid
                          container
                          item
                          className={classes.sellerInfo}
                          direction={'column'}
                          wrap={'nowrap'}
                        >
                          <Grid item xs>
                            <Typography
                              align={'justify'}
                              className={classes.warrningText}
                              variant={'body2'}
                            >
                              Once you make a channel public, everyone can see
                              all messages forever. This cannot be undone.
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item className={classes.spacingFields}>
                      <LoadingButton
                        classes={{ button: classes.button }}
                        disabled={
                          !isValid || balance.lt(publicChannelFee) || sending
                        }
                        text={
                          <>
                            Make channel public
                            <span className={classes.buttonPrice}>
                              ({publicChannelFee} ZEC)
                            </span>
                          </>
                        }
                        onClick={handleSubmit}
                        color='primary'
                        inProgress={sending}
                        variant='contained'
                      />
                      {balance.lt(publicChannelFee) && (
                        <Typography variant='body2' className={classes.error}>
                          You don't have enough funds
                        </Typography>
                      )}
                      <Typography variant='body2' className={classes.priceInfo}>
                        {`The price of public channel is ${publicChannelFee} ZEC (${(
                          publicChannelFee * zcashRate
                        ).toFixed(2)} USD).`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Scrollbars>
              )}
            </AutoSizer>
          </Modal>
        )
      }}
    </Formik>
  )
}

PublishChannelModal.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    description: PropTypes.string.isRequired
  }).isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired,
  publicChannelFee: PropTypes.number.isRequired,
  zcashRate: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  publishChannel: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  channel: PropTypes.object.isRequired,
  publicChannels: PropTypes.object.isRequired
}

PublishChannelModal.defaultProps = {
  initialValues: {
    description: ''
  },
  channel: {}
}

export default R.compose(React.memo, withStyles(styles))(PublishChannelModal)
