import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withStyles } from '@material-ui/core/styles'
import { Grid, Typography } from '@material-ui/core'

const styles = theme => ({
  root: {
    padding: 0
  },
  divider: {
    height: 1,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  titleDiv: {
    paddingLeft: 12,
    paddingRight: 12
  }
})

export const MessagesDivider = ({ classes, title }) => {
  return (
    <Grid container justify='center' alignItems='center'>
      <Grid item xs>
        <div className={classes.divider} />
      </Grid>
      <Grid item className={classes.titleDiv}>
        <Typography variant='body1'>{title}</Typography>
      </Grid>
      <Grid item xs>
        <div className={classes.divider} />
      </Grid>
    </Grid>
  )
}
MessagesDivider.propTypes = {
  classes: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired
}

MessagesDivider.defaultProps = {}

export default R.compose(React.memo, withStyles(styles))(MessagesDivider)
