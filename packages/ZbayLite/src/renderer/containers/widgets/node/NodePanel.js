import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodePanelComponent from '../../../components/widgets/node/NodePanel'
import nodeSelectors from '../../../store/selectors/node'

export const mapStateToProps = state => ({
  status: nodeSelectors.status(state)
})

export const NodePanel = ({ status }) => {
  const [expanded, setExpanded] = React.useState(false)
  return <NodePanelComponent expanded={expanded} status={status} setExpanded={setExpanded} />
}

export default R.compose(
  React.memo,
  connect(mapStateToProps)
)(NodePanel)
