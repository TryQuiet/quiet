import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import IconButton from '@material-ui/core/IconButton'

import PlusIconWithBorder from './Icons/PlusIconWithBorder'
import Tooltip from './Tooltip'

const styles = theme => ({
  root: {
    marginTop: 25,
    height: 32,
    paddingLeft: 16,
    paddingRight: 16
  },
  title: {
    opacity: 0.7,
    fontWeight: 500
  },
  iconButton: {
    opacity: 0.7,
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1
    }
  },
  tooltip: {
    marginTop: -1
  }
})

export const SidebarHeader = ({ classes, title, action, tooltipText }) => {
  return (
    <Grid
      container
      direction='row'
      justify='space-between'
      alignItems='center'
      className={classes.root}
    >
      <Grid item>
        <Typography variant='body2' className={classes.title}>
          {title}
        </Typography>
      </Grid>
      <Grid item>
        <Tooltip title={tooltipText} className={classes.tooltip} placement='bottom'>
          <IconButton className={classes.iconButton} edge='end' onClick={action}>
            <PlusIconWithBorder color='white' />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  )
}
SidebarHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  tooltipText: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.element)
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(SidebarHeader)
