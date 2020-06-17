import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { Grid, LinearProgress, Typography } from '@material-ui/core'

import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  rootBar: {
    width: 350,
    marginTop: 32,
    marginBottom: 16
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  info: {
    lineHeight: '19px',
    color: theme.palette.colors.darkGray
  }
})

export const CreateChannelFormFinish = ({ classes }) => (
  <Grid container alignItems='center' justify='center'>
    <Grid item>
      <Typography variant='h3'>Creating Channel</Typography>
    </Grid>
    <Grid item container justify='center' alignItems='center'>
      <LinearProgress
        classes={{
          root: classes.rootBar,
          barColorPrimary: classes.progressBar
        }}
      />
    </Grid>
    <Grid item>
      <Typography variant='body1' className={classes.info}>
        Generating keys
      </Typography>
    </Grid>
  </Grid>
)

CreateChannelFormFinish.propTypes = {
  classes: PropTypes.object.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(CreateChannelFormFinish)
