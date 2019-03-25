import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelMenuAction from '../../../components/widgets/channels/ChannelMenuAction'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onInfo: () => console.warn('[ChannelMenuAction] onInfo not implemented'),
  onMute: () => console.warn('[ChannelMenuAction] onMute not implemented'),
  onDelete: () => console.warn('[ChannelMenuAction] onDelete not implemented')
}, dispatch)

export default connect(null, mapDispatchToProps)(ChannelMenuAction)
