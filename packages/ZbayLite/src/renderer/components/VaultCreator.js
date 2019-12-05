import React from 'react'
import { Formik, Form } from 'formik'
import PropTypes from 'prop-types'
import * as Yup from 'yup'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import PasswordField from './ui/form/PasswordField'
import TextField from './ui/form/TextField'
import LoadingButton from './ui/LoadingButton'

const styles = theme => ({
  submit: {
    minHeight: 56
  }
})

export const formSchema = Yup.object().shape({
  name: Yup.string()
    .matches(/^\w+$/, 'Should only contain alphanumeric characters and underscore.')
    .min(3, 'Should contain at least 3 characters')
    .max(20, 'Should contain no more than 20 characters')
    .required('Required'),
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
  inProgress
}) => (
  <Formik
    onSubmit={onSend}
    validationSchema={formSchema}
    initialValues={initialValues}
    validate={validateForm}
  >
    {({ errors, isSubmitting }) => (
      <Form>
        <Grid
          container
          spacing={2}
          justify='flex-start'
          direction='column'
          className={classes.fullContainer}
        >
          <Grid item>
            <TextField name='name' label='Name' disabled={finished === false || isSubmitting} />
          </Grid>
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
            <LoadingButton
              type='submit'
              variant='contained'
              size='large'
              color='primary'
              margin='normal'
              fullWidth
              inProgress={finished === false || isSubmitting}
              disabled={finished === false || isSubmitting}
            />
          </Grid>
        </Grid>
      </Form>
    )}
  </Formik>
)

VaultCreator.propTypes = {
  classes: PropTypes.object.isRequired,
  onSend: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    name: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    repeat: PropTypes.string.isRequired
  }).isRequired
}

VaultCreator.defaultProps = {
  initialValues: {
    name: '',
    password: '',
    repeat: ''
  }
}

export default React.memo(withStyles(styles)(VaultCreator))
