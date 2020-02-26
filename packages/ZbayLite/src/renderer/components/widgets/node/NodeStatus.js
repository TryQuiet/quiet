import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import PulseDot from '../../ui/PulseDot'
import SpinnerLoader from '../../ui/SpinnerLoader'

const styles = theme => ({
  root: {},
  status: {
    color: 'inherit'
  },
  icon: {
    marginRight: 8,
    marginBottom: 1
  },
  spinner: {
    marginTop: 16,
    marginRight: 8,
    color: 'inherit'
  }
})

export const NodeStatus = ({
  classes,
  status,
  percentSynced,
  freeUtxos,
  connections
}) => {
  return (
    <Grid container direction='row' alignItems='center' justify='flex-end'>
      <Grid item>
        {status === 'healthy' || status === 'down' ? (
          <PulseDot
            size={6}
            color={freeUtxos && connections ? status : 'down'}
            className={classes.icon}
          />
        ) : (
          <SpinnerLoader size={10} classes={{ spinner: classes.spinner }} />
        )}
      </Grid>
      <Grid item>
        <Typography
          display='inline'
          variant='caption'
          className={classes.status}
        >
          {connections
            ? percentSynced !== null && `${percentSynced}%`
            : `Offline`}
        </Typography>
      </Grid>
    </Grid>
  )
}
NodeStatus.propTypes = {
  classes: PropTypes.object.isRequired,
  status: PropTypes.oneOf([
    'healthy',
    'syncing',
    'restarting',
    'down',
    'connecting'
  ]).isRequired,
  percentSynced: PropTypes.string,
  freeUtxos: PropTypes.number.isRequired,
  connections: PropTypes.number.isRequired
}

NodeStatus.defaultProps = {
  percentSynced: null,
  connections: 0
}

export default React.memo(withStyles(styles)(NodeStatus))
