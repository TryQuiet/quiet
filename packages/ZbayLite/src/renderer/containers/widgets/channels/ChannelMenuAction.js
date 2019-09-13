import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { withRouter } from 'react-router-dom'

import ChannelMenuAction from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators } from '../../../store/handlers/modals'
import importedChannelHandler from '../../../store/handlers/importedChannel'

export const mapDispatchToProps = (dispatch, { history }) => bindActionCreators({
  onInfo: actionCreators.openModal('channelInfo'),
  onMute: () => console.warn('[ChannelMenuAction] onMute not implemented'),
  onDelete: () => importedChannelHandler.epics.removeChannel(history)
}, dispatch)

export default R.compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(ChannelMenuAction)
