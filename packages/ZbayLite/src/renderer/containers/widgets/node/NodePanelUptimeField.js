import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { connect } from 'react-redux'

import Typography from '@material-ui/core/Typography'

import NodePanelField from '../../../components/widgets/node/NodePanelField'

import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  uptime: nodeSelectors.uptime(state)
})

export const NodePanelUptimeField = ({ uptime }) => (
  <NodePanelField name='Uptime'>
    <Typography display='inline' variant='overline'>
      {R.isEmpty(uptime) ? '-' : null}
      {uptime.days ? `${uptime.days}d  ` : null}
      {uptime.hours ? `${uptime.hours}h  ` : null}
      {uptime.minutes ? `${uptime.minutes}m` : null}
    </Typography>
  </NodePanelField>
)

NodePanelUptimeField.propTypes = {
  uptime: PropTypes.exact({
    days: PropTypes.number,
    hours: PropTypes.number,
    minutes: PropTypes.number,
    seconds: PropTypes.number
  }).isRequired
}

export default connect(mapStateToProps)(NodePanelUptimeField)
