import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelMessage from '../../../components/widgets/channels/ChannelMessage'
import operationsHandlers from '../../../store/handlers/operations'
import channelHandlers from '../../../store/handlers/channel'

export const mapDispatchToProps = (dispatch, ownProps) => bindActionCreators({
  onCancel: () => operationsHandlers.actions.removeOperation(ownProps.message.get('id')),
  onResend: () => channelHandlers.epics.resendMessage(ownProps.message.toJS())
}, dispatch)

export default connect(null, mapDispatchToProps)(ChannelMessage)
