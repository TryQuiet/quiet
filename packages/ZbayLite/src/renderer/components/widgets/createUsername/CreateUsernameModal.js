import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import classNames from 'classnames'

import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal'
import UsernameCreated from './UsernameCreated'

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
    padding: '0px 24px'
  },
  title: {
    marginTop: 24
  },
  fullWidth: {
    paddingBottom: 25
  },
  description: {
    marginTop: 6
  },
  field: {
    marginTop: 18
  },
  buttonDiv: {
    marginTop: 24
  },
  info: {
    marginTop: 2
  },
  button: {
    width: 185,
    height: 60,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.gray
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
  }
})

Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname) {
  return this.test(
    'test',
    'Sorry username already taken. please choose another',
    function (value) {
      const isUsernameTaken = checkNickname(value)
      return !isUsernameTaken
    }
  )
})

const getErrorsFromValidationError = validationError => {
  const FIRST_ERROR = 0
  return validationError.inner.reduce((errors, error) => {
    return {
      ...errors,
      [error.path]: error.errors[FIRST_ERROR]
    }
  }, {})
}

const sanitize = x => (x ? x.replace(/[^a-z0-9]+$/g, '') : undefined)

const validate = ({ nickname }, checkNickname) => {
  const sanitizedValue = sanitize(nickname)
  const values = {
    nickname: sanitizedValue
  }
  const validationSchema = getValidationSchema(values, checkNickname)
  try {
    validationSchema.validateSync(values, { abortEarly: false })
    return {}
  } catch (error) {
    return getErrorsFromValidationError(error)
  }
}

const getValidationSchema = (values, checkNickname) => {
  return Yup.object().shape({
    nickname: Yup.string()
      .min(3)
      .max(20)
      .matches(/^[a-z0-9]+$/, {
        message:
          'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only',
        excludeEmptyString: true
      })
      .validateMessage(checkNickname)
      .required('Required')
  })
}

const CustomInputComponent = ({
  classes,
  field,
  form: { touched, errors, values },

  ...props
}) => {
  const { value, ...rest } = field
  const updatedValue = sanitize(value)

  return (
    <TextField
      variant={'outlined'}
      fullWidth
      className={classNames({
        [classes.focus]: true,
        [classes.margin]: true,
        [classes.error]: errors['nickname'] || false
      })}
      placeholder={'Enter a username'}
      value={updatedValue}
      error={errors['nickname'] || false}
      helperText={errors['nickname']}
      defaultValue={values['nickname'] || ''}
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
  checkNickname,
  handleSubmit,
  enoughMoney,
  usernameFee,
  zecRate
}) => {
  const [formSent, setFormSent] = useState(false)
  return (
    <Modal open={open} handleClose={handleClose}>
      <Grid container className={classes.main} direction='column'>
        {!formSent ? (
          <React.Fragment>
            <Grid className={classes.title} item>
              <Typography variant={'h3'}>Register a username</Typography>
            </Grid>
            <Grid className={classes.description} item>
              <Typography variant={'body2'}>
                {`Zbay may soon charge a fee for this, but it's (almost) free for now, and we've already provided the funds you need. Your username will last forever, so choose it well...`}
              </Typography>
            </Grid>
            <Formik
              onSubmit={values => submitForm(handleSubmit, values, setFormSent)}
              initialValues={initialValues}
              validate={values => validate(values, checkNickname)}
            >
              {({
                values,
                isSubmitting,
                isValid,
                handleChange,
                validateForm,
                validateField
              }) => {
                return (
                  <Form className={classes.fullWidth}>
                    <Grid container className={classes.container}>
                      <Grid className={classes.field} item xs={12}>
                        <Typography variant='caption' className={classes.label}>
                          Username
                        </Typography>
                        <Field
                          name='nickname'
                          classes={classes}
                          component={CustomInputComponent}
                        />
                      </Grid>
                      <Grid className={classes.info} item xs={12}>
                        <Typography variant='caption'>
                          Lowercase letters and numbers only; no spaces or
                          special characters allowed.
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      className={classes.buttonsContainer}
                      direction={'row'}
                      justify={'flex-start'}
                      spacing={2}
                    >
                      <Grid item xs={'auto'} className={classes.buttonDiv}>
                        <Button
                          variant='contained'
                          size='small'
                          color='primary'
                          type='submit'
                          fullWidth
                          disabled={!isValid || isSubmitting || !enoughMoney}
                          className={classes.button}
                        >
                          Create username
                        </Button>
                      </Grid>
                    </Grid>
                  </Form>
                )
              }}
            </Formik>
          </React.Fragment>
        ) : (
          <UsernameCreated
            handleClose={handleClose}
            setFormSent={setFormSent}
          />
        )}
      </Grid>
    </Modal>
  )
}

CreateUsernameModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialValues: PropTypes.object.isRequired,
  checkNickname: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  enoughMoney: PropTypes.bool.isRequired,
  usernameFee: PropTypes.number.isRequired,
  zecRate: PropTypes.object.isRequired
}

export default R.compose(React.memo, withStyles(styles))(CreateUsernameModal)
