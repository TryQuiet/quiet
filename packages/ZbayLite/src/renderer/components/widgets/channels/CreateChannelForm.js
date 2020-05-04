import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik, Form } from 'formik'

import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import WarningIcon from '@material-ui/icons/Warning'
import { Typography } from '@material-ui/core'

import TextField from '../../ui/form/TextField'

const styles = theme => ({
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  gutter: {
    marginTop: 8,
    marginBottom: 24
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
  },
  warrningIcon: {
    color: '#FFCC00'
  },
  iconDiv: {
    width: 24,
    height: 28,
    marginRight: 8
  }
})
const parseChannelName = (name = '') => {
  return name.toLowerCase().replace(/ /g, '-')
}
export const CreateChannelForm = ({ classes, onSubmit }) => (
  <Formik
    onSubmit={(values, formActions) => {
      onSubmit({ ...values, name: parseChannelName(values.name) }, formActions)
    }}
  >
    {({ isSubmitting, values }) => (
      <Form className={classes.fullContainer}>
        <Grid
          container
          justify='flex-start'
          direction='column'
          className={classes.fullContainer}
        >
          <Typography variant='h3' className={classes.title}>
            Create a new channel
          </Typography>
          <Typography variant='body2'>Channel name</Typography>

          <TextField name='name' />
          <div className={classes.gutter}>
            {values.name && (
              <Grid container alignItems='center'>
                <Grid item className={classes.iconDiv}>
                  <WarningIcon className={classes.warrningIcon} />
                </Grid>
                <Grid item className=''>
                  <Typography variant='body2'>
                    Your channel will be created as{' '}
                    {parseChannelName(values.name)}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </div>
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

export default R.compose(React.memo, withStyles(styles))(CreateChannelForm)
