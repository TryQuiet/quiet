import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import PasswordField from '../ui/form/PasswordField'
import Icon from '../ui/Icon'
import LoadindButton from '../ui/LoadingButton'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const styles = theme => ({
  paper: {
    width: '100vw',
    height: '100vh',
    padding: 20
  },
  icon: {
    width: 285,
    height: 67
  },
  logoContainer: {
    height: 167
  },
  passwordField: {
    width: 286
  },
  title: {
    textAlign: 'center',
    width: '100%',
    fontSize: 24,
    height: 36,
    marginBottom: 16
  }
})

const formSchema = Yup.object().shape({
  password: Yup.string().required('Required')
})

export const VaultUnlockerForm = ({
  classes,
  locked,
  unlocking,
  initialValues,
  onSubmit
}) => (
  <Formik
    onSubmit={onSubmit}
    validationSchema={formSchema}
    initialValues={initialValues}
  >
    {({ isSubmitting }) => (
      <Form>
        <Grid container direction='column' spacing={2} justfy='center' alignItems='center' alignContent='center'>
          <Grid className={classes.logoContainer} container item xs={12} justify='center' alignItems='center' alignContent='center'>
            <Icon className={classes.icon} src={icon} />
          </Grid>
          <Grid container item xs={12} wrap='wrap' justify='center'>
            <Typography className={classes.title} variant='body1' gutterBottom>
                  Log in
            </Typography>
          </Grid>
          <Grid container item justify='center'>
            <PasswordField
              name='password'
              className={classes.passwordField}
              label='Enter Password'
              fullWidth
            />
          </Grid>
          <Grid container item justify='center'>
            <LoadindButton
              type='submit'
              variant='contained'
              size='large'
              color='primary'
              margin='normal'
              text='Login'
              fullWidth
              disabled={isSubmitting || unlocking}
              inProgress={isSubmitting || unlocking}
            />
          </Grid>
        </Grid>
      </Form>
    )}
  </Formik>
)

VaultUnlockerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  locked: PropTypes.bool.isRequired,
  unlocking: PropTypes.bool.isRequired,
  initialValue: PropTypes.shape({
    password: PropTypes.string.isRequired
  })
}

VaultUnlockerForm.defaultProps = {
  initialValues: {
    password: ''
  },
  unlocking: false,
  locked: true
}

export default withStyles(styles)(VaultUnlockerForm)
