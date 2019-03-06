import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'

import RefreshIcon from '@material-ui/icons/Refresh'
import PowerSettingsIcon from '@material-ui/icons/PowerSettingsNew'

export const NodePanelActions = ({ onRestart, onPower }) => (
  <Grid container justify='flex-end'>
    <IconButton onClick={onRestart}>
      <RefreshIcon />
    </IconButton>
    <IconButton onClick={onPower}>
      <PowerSettingsIcon />
    </IconButton>
  </Grid>
)

NodePanelActions.propTypes = {
  onRestart: PropTypes.func.isRequired,
  onPower: PropTypes.func.isRequired
}

export default React.memo(NodePanelActions)
