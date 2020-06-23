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
import Immutable from 'immutable'
import WarningIcon from '@material-ui/icons/Warning'
import { TextField } from './form/TextField'
import exclamationMark from '../../static/images/exclamationMark.svg'
import Icon from './Icon'
import Modal from './Modal'
import {
  CHANNEL_DESCRIPTION_SIZE,
  PUBLISH_CHANNEL_NAME_SIZE
} from '../../zbay/transit'
import LoadingButton from './LoadingButton'
import { getBytesSize } from '../../../shared/helpers'

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
  description: { width: '90%' },
  warrningIcon: {
    color: '#FFCC00'
  },
  gutter: {
    marginTop: 8,
    marginBottom: 24
  },
  iconDiv: {
    width: 24,
    height: 28,
    marginRight: 8
  }
})

export const formSchema = publicChannels =>
  Yup.object().shape(
    {
      name: Yup.string()
        .matches(/^[a-z0-9 \--_]+$/, {
          message:
            'Channel name cannot have any spaces or special characters, must be lowercase letters and numbers only',
          excludeEmptyString: true
        })
        .validateName(publicChannels)
        .validateSize(PUBLISH_CHANNEL_NAME_SIZE, 'Channel name is too long')
        .required('Must include a channel name'),
      description: Yup.string().validateSize(
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
      const isNameTaken = publicChannels.get(parseChannelName(value))
      return !isNameTaken
    }
  )
})
Yup.addMethod(Yup.mixed, 'validateSize', function (maxSize, errorMessage) {
  return this.test('testSize', errorMessage, function (value) {
    return getBytesSize(value) <= maxSize
  })
})
const parseChannelName = (name = '') => {
  return name.toLowerCase().replace(/  +/g, '-')
}
export const PublishChannelModal = ({
  classes,
  balance,
  handleClose,
  open,
  publicChannelFee,
  zcashRate,
  publicChannels,
  channel,
  publishChannel
}) => {
  const formikRef = React.useRef()
  React.useEffect(() => {
    formikRef.current.runValidations()
    formikRef.current.getFormikActions().setFieldTouched('name', true)
  }, [channel.get('id')])

  const [sending, setSending] = React.useState(false)
  return (
    <Formik
      enableReinitialize
      ref={formikRef}
      onSubmit={async (values, { resetForm }) => {
        setSending(true)
        await publishChannel({
          channelAddress: channel.get('address'),
          channelName: parseChannelName(values.name),
          channelDescription: values.description,
          channelIvk: channel.getIn(['keys', 'ivk'])
        })
        setSending(false)
        handleClose()
      }}
      isInitialValid={
        !publicChannels.get(parseChannelName(channel.get('name')))
      }
      initialValues={{ name: channel.get('name'), description: '' }}
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
                    <div className={classes.gutter}>
                      {values.name.includes(' ') && (
                        <Grid container alignItems='center' direction='row'>
                          <Grid item className={classes.iconDiv}>
                            <WarningIcon className={classes.warrningIcon} />
                          </Grid>
                          <Grid item xs className=''>
                            <Typography variant='body2'>
                              Your channel will be created as{' '}
                              {parseChannelName(values.name)}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}
                    </div>
                    <Grid item className={classes.spacingFields}>
                      <Typography
                        variant='body2'
                        className={classes.fieldTitle}
                      >
                        Description (Optional)
                      </Typography>
                      <span className={classes.counter}>
                        {CHANNEL_DESCRIPTION_SIZE(currentNetwork) -
                          getBytesSize(values.description)}
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
                        {CHANNEL_DESCRIPTION_SIZE(currentNetwork)} max
                        characters
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
                              (${(publicChannelFee * zcashRate).toFixed(4)})
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
                        {`Registering a public channel may cost more someday,but now it's (almost) free`}
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
  channel: Immutable.Map({ name: '', description: '' })
}

export default R.compose(React.memo, withStyles(styles))(PublishChannelModal)
