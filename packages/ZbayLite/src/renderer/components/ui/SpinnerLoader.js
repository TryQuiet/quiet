import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import CircularProgress from '@material-ui/core/CircularProgress'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import { LoaderState } from '../../store/handlers/utils'

const styles = theme => ({
  message: {
    marginTop: theme.spacing.unit * 2,
    color: theme.palette.primary.main,
    fontSize: '0.9rem'
  }
})

export const SpinnerLoader = ({ classes, message, className }) => (
  <Grid
    container
    justify='center'
    alignItems='center'
    direction='column'
    className={className}
  >
    <CircularProgress />
    <Typography variant='caption' className={classes.message} align='center'>
      { message }
    </Typography>
  </Grid>
)

SpinnerLoader.propTypes = {
  classes: PropTypes.object.isRequired,
  classname: PropTypes.string,
  message: PropTypes.string
}

const SpinnerLoaderComponent = R.compose(
  React.memo,
  withStyles(styles)
)(SpinnerLoader)

const withSpinnerLoader = (Wrapped) => {
  const C = ({ loader, ...props }) => (
    loader.loading
      ? <SpinnerLoaderComponent message={loader.message} />
      : <Wrapped {...props} />
  )
  C.displayName = Wrapped.displayName || Wrapped.name || 'Component'
  C.propTypes = {
    loader: PropTypes.instanceOf(LoaderState)
  }
  return C
}

export default SpinnerLoaderComponent

export {
  withSpinnerLoader
}
