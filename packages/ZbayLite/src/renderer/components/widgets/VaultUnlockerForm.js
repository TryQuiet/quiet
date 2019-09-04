import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'

import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import LockOpenIcon from '@material-ui/icons/LockOpen'

import PasswordField from '../ui/form/PasswordField'
import ProgressFab from '../ui/ProgressFab'

const styles = theme => ({
  paper: {
    padding: '20px'
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
        <Paper className={classes.paper}>
          <Grid container direction='row' spacing={2} alignItems='center'>
            <Grid item>
              <PasswordField
                name='password'
                label='Master password'
                fullWidth
              />
            </Grid>
            <Grid item>
              <ProgressFab
                label='Unlock'
                type='submit'
                loading={isSubmitting || unlocking}
                success={!locked}
                disabled={!locked || isSubmitting}
              >
                <LockOpenIcon />
              </ProgressFab>
            </Grid>
          </Grid>
        </Paper>
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
