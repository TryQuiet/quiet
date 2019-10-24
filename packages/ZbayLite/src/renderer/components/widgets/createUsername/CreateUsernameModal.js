import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form, Field } from 'formik'
import * as R from 'ramda'
import classNames from 'classnames'

import AppBar from '@material-ui/core/AppBar'
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
    width: 126,
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
  }
})

Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname) {
  return this.test('test', 'Sorry username already taken. please choose another', function (
    value
  ) {
    const isUsernameTaken = checkNickname(value)
    return !isUsernameTaken
  })
})

const getErrorsFromValidationError = (validationError) => {
  const FIRST_ERROR = 0
  return validationError.inner.reduce((errors, error) => {
    return {
      ...errors,
      [error.path]: error.errors[FIRST_ERROR]
    }
  }, {})
}

const sanitize = (x) => x ? x.replace(/[^a-z0-9]+$/g, '') : undefined

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
  return (
    Yup.object().shape({
      nickname: Yup.string()
        .min(3)
        .max(20)
        .matches(/^[a-z0-9]+$/, {
          message: 'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only',
          excludeEmptyString: true
        })
        .validateMessage(checkNickname)
        .required('Required')
    })
  )
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
      onPaste={(e) => e.preventDefault()} />
  )
}

const submitForm = (handleSubmit, values, setFormSent) => {
  setFormSent(true)
  handleSubmit(values)
}

export const CreateUsernameModal = ({ classes, open, handleClose, initialValues, checkNickname, handleSubmit }) => {
  const [formSent, setFormSent] = useState(false)
  return (
    <Modal open={open} handleClose={handleClose} title='Create username'>
      <AppBar position='static' color='default'>
        <Grid container className={classes.main} direction='column' justify='center'>
          {!formSent ? (
            <React.Fragment>
              <Grid className={classes.title} item xs={12}>
                <Typography variant={'h4'}>Create username</Typography>
              </Grid>
              <Grid className={classes.description} item xs={12}>
                <Typography variant={'body2'}>You need a username to send and receive direct messages. Your username will last forever, so choose it well. To support future development, Zbay charges a small fee of 0.025 ZEC, which is approximately $1 USD.</Typography>
              </Grid>
              <Formik
                onSubmit={handleSubmit}
                initialValues={initialValues}
                validate={(values) => validate(values, checkNickname)}
              >
                {({ values, isSubmitting, isValid, handleChange, validateForm, validateField }) => {
                  return (
                    <Form className={classes.fullWidth}>
                      <Grid container className={classes.container}>
                        <Grid className={classes.field} item xs={12}>
                          <Field name='nickname' classes={classes} component={CustomInputComponent} />
                        </Grid>
                        <Grid className={classes.info} item xs={12}>
                          <Typography variant='caption'>Your username cannot have any spaces or special characters, must be lowercase letters and numbers only</Typography>
                        </Grid>
                      </Grid>
                      <Grid container className={classes.buttonsContainer} direction={'row'} justify={'flex-start'} spacing={2}>
                        <Grid item xs={'auto'} className={classes.buttonDiv}>
                          <Button
                            variant='contained'
                            size='small'
                            color='primary'
                            onClick={() => submitForm(handleSubmit, values, setFormSent)}
                            fullWidth
                            disabled={!isValid || isSubmitting}
                            className={classes.button}
                          >
                Continue
                          </Button>
                        </Grid>
                        <Grid item xs={'auto'} className={classes.buttonDiv}>
                          <Button
                            variant='contained'
                            onClick={handleClose}
                            size='small'
                            fullWidth
                            className={classes.closeModal}
                          >
                Maybe later
                          </Button>
                        </Grid>
                      </Grid>
                    </Form>)
                }}
              </Formik>
            </React.Fragment>)
            : (
              <UsernameCreated handleClose={handleClose} setFormSent={setFormSent} />
            )}
        </Grid>
      </AppBar>
    </Modal>
  )
}

CreateUsernameModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialValues: PropTypes.object.isRequired,
  checkNickname: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(CreateUsernameModal)
