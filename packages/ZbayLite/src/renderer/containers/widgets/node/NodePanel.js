import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import NodePanelComponent from '../../../components/widgets/node/NodePanel'
import nodeHandlers from '../../../store/handlers/node'
import { useInterval } from '../../hooks'

export const mapDispatchToProps = dispatch => bindActionCreators({
  getStatus: nodeHandlers.epics.getStatus
}, dispatch)

export const NodePanel = ({ className, getStatus }) => {
  useInterval(getStatus, 15000)
  return (
    <NodePanelComponent className={className} />
  )
}

export default connect(null, mapDispatchToProps)(NodePanel)
