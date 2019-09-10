import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    height: '42px',
    paddingRight: theme.spacing(1)
  }
})

export const SidebarHeader = ({ classes, title, actions }) => (
  <Grid
    container
    direction='row'
    justify='space-between'
    alignItems='center'
    className={classes.root}
  >
    <Grid item>
      <Typography variant='subtitle1'>
        {title}
      </Typography>
    </Grid>
    <Grid item>
      {actions}
    </Grid>
  </Grid>
)

SidebarHeader.propTypes = {
  classes: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  actions: PropTypes.arrayOf(PropTypes.element)
}

export default React.memo(withStyles(styles)(SidebarHeader))
