import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  root: {
    minHeight: '100%',
    minWidth: '300px',
    background: '#fff',
    borderRight: 'solid #e8e8e8 1px'
  },
  node: {
  }
}

const Sidebar = ({ classes }) => (
  <Grid container direction='column' justify='space-between' className={classes.root}>
    <Grid item>
      <Grid container direction='column'>
        <Grid item>
          <Typography variant='h5'>
            User
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant='h5'>
            Channels
          </Typography>
        </Grid>
      </Grid>
    </Grid>
    <Grid item>
      <Typography variant='h5'>
        Node
      </Typography>
    </Grid>
  </Grid>
)

Sidebar.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(Sidebar)
