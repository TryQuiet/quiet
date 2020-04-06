import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import NodePanelDetails from '../../../components/widgets/node/NodePanelDetails'

import appSelectors from '../../../store/selectors/app'
import logsHandlers from '../../../store/handlers/logs'

export const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    showLogsPanel: logsHandlers.epics.loadTargetLogs
  }, dispatch)
}

export const mapStateToProps = state => ({
  zbayVersion: appSelectors.version(state)
})

export default connect(mapStateToProps, mapDispatchToProps)(NodePanelDetails)
