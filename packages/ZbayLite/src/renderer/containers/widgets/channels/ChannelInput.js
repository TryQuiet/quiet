import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInput from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import contactsHandlers from '../../../store/handlers/contacts'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  message: channelSelectors.message(state)
})

export const mapDispatchToProps = (dispatch, { contactId }) => bindActionCreators({
  onChange: channelHandlers.actions.setMessage,
  onKeyPress: contactId ? contactsHandlers.epics.sendDirectMessageOnEnter : channelHandlers.epics.sendOnEnter
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
