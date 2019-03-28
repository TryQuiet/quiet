import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import PulseDot from '../../ui/PulseDot'

const styles = theme => ({
  root: {},
  status: {
    paddingLeft: theme.spacing.unit
  }
})

export const NodeStatus = ({ classes, status, percentSynced }) => (
  <Grid container>
    <Grid item>
      <PulseDot size={8} color={status} />
      <Typography inline variant='overline' className={classes.status}>
        {status} { percentSynced !== null && `${percentSynced}%`}
      </Typography>
    </Grid>
  </Grid>
)

NodeStatus.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.oneOf(['healthy', 'syncing', 'restarting', 'down', 'connecting']).isRequired,
  percentSynced: PropTypes.string
}

NodeStatus.defaultProps = {
  percentSynced: null
}

export default React.memo(withStyles(styles)(NodeStatus))
