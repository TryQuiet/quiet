import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelMessage from '../../../components/widgets/channels/ChannelMessage'
import operationsHandlers from '../../../store/handlers/operations'
import channelHandlers from '../../../store/handlers/channel'
import contactsHandlers from '../../../store/handlers/contacts'

export const mapDispatchToProps = (dispatch, ownProps) => bindActionCreators({
  onCancel: () => operationsHandlers.actions.removeOperation(ownProps.message.get('id')),
  onResend: () => ownProps.contactId ? contactsHandlers.epics.resendMessage(ownProps.message.toJS()) : channelHandlers.epics.resendMessage(ownProps.message.toJS())
}, dispatch)
export default connect(null, mapDispatchToProps)(ChannelMessage)
