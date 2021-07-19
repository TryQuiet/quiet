import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda' // change to lodash
import classNames from 'classnames'

import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal'
import UsernameCreated from './UsernameCreated'
import { LoadingButton } from '../../ui/LoadingButton'

const styles = theme => ({
  root: {},
  focus: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue
      }
    }
  },
  margin: {
    '& .MuiFormHelperText-contained': {
      margin: '5px 0px'
    }
  },
  error: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red
      }
    }
  },
  main: {
    backgroundColor: theme.palette.colors.white,
    padding: '0px 32px'
  },
  title: {
    marginTop: 24
  },
  fullWidth: {
    paddingBottom: 25
  },
  note: {
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.colors.black30
  },
  field: {
    marginTop: 18
  },
  buttonDiv: {
    marginTop: 24
  },
  info: {
    lineHeight: '18px',
    color: theme.palette.colors.darkGray,
    letterSpacing: 0.4
  },
  button: {
    width: 139,
    height: 60,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.lightGray,
      color: 'rgba(255,255,255,0.6)'
    }
  },
  closeModal: {
    backgroundColor: 'transparent',
    height: 60,
    fontSize: 16,
    lineHeight: '19px',
    color: theme.palette.colors.darkGray,
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  buttonContainer: {
    marginBottom: 49
  },
  label: {
    fontSize: 12,
    color: theme.palette.colors.black30
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  spacing24: {
    marginTop: 24
  },
  infoDiv: {
    lineHeight: 'initial',
    marginTop: 8
  }
})

const sanitize = x => (x ? x.replace(/[^a-zA-Z0-9]+$/g, '').toLowerCase() : undefined)

const getValidationSchema = (values) => {
  return Yup.object().shape({
    nickname: Yup.string()
      .min(3)
      .max(20)
      .matches(/^[a-zA-Z0-9]+$/, {
        message:
          'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only',
        excludeEmptyString: true
      })
      .required('Required')
  })
}

const CustomInputComponent = ({
  classes,
  field,
  isTouched,
  form: { touched, errors, values },
  certificateRegistrationError,
  ...props
}) => {
  const { value, ...rest } = field
  const updatedValue = sanitize(value)
  const nicknameErrors = errors.nickname || certificateRegistrationError
  return (
    <TextField
      variant={'outlined'}
      fullWidth
      className={classNames({
        [classes.focus]: true,
        [classes.margin]: true,
        [classes.error]: isTouched && nicknameErrors
      })}
      placeholder={'Enter a username'}
      error={isTouched && nicknameErrors}
      helperText={isTouched && nicknameErrors}
      value={updatedValue}
      error={isTouched && nicknameErrors }
      helperText={isTouched && nicknameErrors}
      defaultValue={values.nickname || ''}
      {...rest}
      {...props}
      onPaste={e => e.preventDefault()}
    />
  )
}

const submitForm = (handleSubmit, values, setFormSent) => {
  setFormSent(true)
  handleSubmit(values)
}

export const CreateUsernameModal = ({
  classes,
  open,
  handleClose,
  initialValues,
  handleSubmit,
  isNewUser,
  certificateRegistrationError,
  certificate
}) => {
  const [isTouched, setTouched] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const responseReceived = Boolean(certificateRegistrationError || certificate)
  const waitingForResponse = formSent && !responseReceived
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={isNewUser}>
      <Grid container className={classes.main} direction='column'>
        {isNewUser ? (
          <React.Fragment>
            <Grid className={classes.title} item>
              <Typography variant={'h3'}>Register a username</Typography>
            </Grid>
            <Formik
              onSubmit={values => submitForm(handleSubmit, values, setFormSent)}
              initialValues={initialValues}
              validationSchema={values => getValidationSchema(values, certificateRegistrationError)}>
              {() => {
                return (
                  <Form className={classes.fullWidth}>
                    <Grid container className={classes.container}>
                      <Grid className={classes.field} item xs={12}>
                        <Typography variant='caption' className={classes.label}>
                          Choose your favorite username:{' '}
                        </Typography>
                        <Field
                          name='nickname'
                          classes={classes}
                          component={CustomInputComponent}
                          isTouched={isTouched}
                          certificateRegistrationError={certificateRegistrationError}
                        />
                      </Grid>
                      <Grid item xs={12} className={classes.infoDiv}>
                        <Typography variant='caption' className={classes.info}>
                          Your username cannot have any spaces or special characters, must be
                          lowercase letters and numbers only.
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      className={classes.buttonsContainer}
                      direction={'row'}
                      justify={'flex-start'}
                      spacing={2}>
                      <Grid item xs={'auto'} className={classes.buttonDiv}>
                        <LoadingButton
                          classes={classes}
                          type='submit'
                          variant='contained'
                          size='small'
                          color='primary'
                          margin='normal'
                          text={'Continue'}
                          fullWidth
                          disabled={waitingForResponse}
                          inProgress={waitingForResponse}
                          onClick={() => {
                            setTouched(true)
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Form>
                )
              }}
            </Formik>
          </React.Fragment>
        ) : (
          <UsernameCreated handleClose={handleClose} setFormSent={setFormSent} />
        )}
      </Grid>
    </Modal>
  )
}

CreateUsernameModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialValues: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  enoughMoney: PropTypes.bool.isRequired,
  usernameFee: PropTypes.number.isRequired,
  zecRate: PropTypes.object.isRequired,
  isNewUser: PropTypes.bool.isRequired,
  certificateRegistrationError: PropTypes.string.isRequired,
  certificate: PropTypes.string.isRequired
}

export default R.compose(React.memo, withStyles(styles))(CreateUsernameModal)
