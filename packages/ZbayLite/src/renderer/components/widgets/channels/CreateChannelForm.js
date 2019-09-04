import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik, Form } from 'formik'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import TextField from '../../ui/form/TextField'

const styles = theme => ({
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  gutter: {
    marginBottom: theme.spacing(4)
  },
  button: {
    width: 165
  }
})

export const CreateChannelForm = ({ classes, onSubmit }) => (
  <Formik
    onSubmit={onSubmit}
  >
    {({ isSubmitting }) => (
      <Form className={classes.fullContainer}>
        <Grid
          container
          justify='flex-start'
          direction='column'
          className={classes.fullContainer}
        >
          <TextField
            name='name'
            label='Channel name'
            className={classes.gutter}
          />
          <TextField
            multiline
            rows='6'
            name='description'
            label='Channel description'
            className={classes.gutter}
          />
          <Button
            className={classes.button}
            variant='contained'
            color='primary'
            size='large'
            disabled={isSubmitting}
            type='submit'
          >
            Create Channel
          </Button>
        </Grid>
      </Form>
    )}
  </Formik>
)

CreateChannelForm.propTypes = {
  classes: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(CreateChannelForm)
