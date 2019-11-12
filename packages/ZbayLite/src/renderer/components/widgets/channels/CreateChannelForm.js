import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik, Form } from 'formik'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import TextField from '../../ui/form/TextField'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  gutter: {
    marginBottom: theme.spacing(4)
  },
  button: {
    width: 165,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  title: {
    marginBottom: 24
  }
})

export const CreateChannelForm = ({ classes, onSubmit }) => (
  <Formik onSubmit={onSubmit}>
    {({ isSubmitting }) => (
      <Form className={classes.fullContainer}>
        <Grid container justify='flex-start' direction='column' className={classes.fullContainer}>
          <Typography variant='h3' className={classes.title}>
            Create a new channel
          </Typography>
          <Typography variant='body2'>Channel name</Typography>
          <TextField name='name' className={classes.gutter} />
          <Typography variant='body2'>Channel description</Typography>

          <TextField multiline name='description' className={classes.gutter} />
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
