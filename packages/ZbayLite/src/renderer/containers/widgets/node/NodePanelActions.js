import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import NodePanelActions from '../../../components/widgets/node/NodePanelActions'

import nodeHandlers from '../../../store/handlers/node'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onRestart: nodeHandlers.epics.restart,
  onPower: nodeHandlers.epics.togglePower
}, dispatch)

export default connect(null, mapDispatchToProps)(NodePanelActions)
