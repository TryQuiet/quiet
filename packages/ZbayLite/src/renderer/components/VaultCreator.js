import React from 'react'
import { Formik, Form } from 'formik'
import PropTypes from 'prop-types'
import * as Yup from 'yup'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import PasswordField from './ui/form/PasswordField'
// import TextField from './ui/form/TextField'
import LoadindButton from './ui/LoadingButton'

const styles = theme => ({
  submit: {
    minHeight: 56
  }
})

export const formSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Should contain at least 6 characters')
    .required('Required'),
  repeat: Yup.string()
    .min(6, 'Should contain at least 6 characters')
    .required('Required')
})

export const validateForm = values =>
  values.repeat !== values.password && { repeat: "Doesn't match password." }

export const VaultCreator = ({
  classes,
  onSend,
  initialValues,
  buttonStyles,
  finished,
  inProgress,
  storePass,
  setPasswordPosted,
  isVaultCreationComplete,
  passwordPosted
}) => {
  return (
    <Formik
      validationSchema={formSchema}
      initialValues={initialValues}
      validate={validateForm}
    >
      {({ errors, isSubmitting, values, isValid }) => {
        return (
          <Form>
            <Grid
              container
              spacing={2}
              justify='flex-start'
              direction='column'
              className={classes.fullContainer}
            >
              <Grid item>
                <PasswordField
                  name='password'
                  label='Enter a password'
                  fullWidth
                  disabled={finished === false || isSubmitting}
                />
              </Grid>
              <Grid item>
                <PasswordField
                  name='repeat'
                  label='Re-enter password'
                  error={errors.repeat}
                  fullWidth
                  disabled={finished === false || isSubmitting}
                />
              </Grid>
              <Grid item>
                <LoadindButton
                  variant='contained'
                  size='large'
                  color='primary'
                  margin='normal'
                  onClick={() => {
                    storePass(values.password)
                    setPasswordPosted(true)
                  }}
                  fullWidth
                  inProgress={(finished === false) || (passwordPosted && !isVaultCreationComplete)}
                  disabled={!isValid || (passwordPosted && !isVaultCreationComplete)}
                />
              </Grid>
            </Grid>
          </Form>
        )
      }}
    </Formik>
  )
}

VaultCreator.propTypes = {
  finished: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  onSend: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    password: PropTypes.string.isRequired,
    repeat: PropTypes.string.isRequired
  }).isRequired
}

VaultCreator.defaultProps = {
  initialValues: {
    password: '',
    repeat: ''
  }
}

export default React.memo(withStyles(styles)(VaultCreator))
