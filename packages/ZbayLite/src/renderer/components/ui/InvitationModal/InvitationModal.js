import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  root: {
    marginTop: 20,
    paddingLeft: 15,
    paddingRight: 15
  },
  closeIcon: {
    marginTop: -theme.spacing(2),
    marginLeft: -theme.spacing(2)
  },
  info: {
    marginTop: theme.spacing(3)
  },
  infoText: {
    width: 350
  },
  header: {
    marginTop: -theme.spacing(2)
  }
})

export const InvitationModal = ({ classes, children, info, title }) => {
  return (
    <Grid item xs container justify='flex-start' direction='column' className={classes.root}>
      <Grid item className={classes.header}>
        <Typography variant='h3'>{title}</Typography>
      </Grid>
      <Grid item className={classes.info}>
        <Typography variant='body2' className={classes.infoText}>
          {info}
        </Typography>
      </Grid>
      {children}
    </Grid>
  )
}

InvitationModal.propTypes = {
  classes: PropTypes.object.isRequired,
  info: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.node])
}

InvitationModal.defaultProps = {}

export default R.compose(
  React.memo,
  withStyles(styles)
)(InvitationModal)
