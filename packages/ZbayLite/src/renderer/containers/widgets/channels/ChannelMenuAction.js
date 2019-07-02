import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelMenuAction from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onInfo: actionCreators.openModal('channelInfo'),
  onMute: () => console.warn('[ChannelMenuAction] onMute not implemented'),
  onDelete: () => console.warn('[ChannelMenuAction] onDelete not implemented')
}, dispatch)

export default connect(null, mapDispatchToProps)(ChannelMenuAction)
