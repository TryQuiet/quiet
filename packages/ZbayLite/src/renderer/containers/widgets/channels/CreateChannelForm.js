import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import CreateChannelForm from '../../../components/widgets/channels/CreateChannelForm'
import channelsHandlers from '../../../store/handlers/channels'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onSubmit: channelsHandlers.epics.createChannel
}, dispatch)

export default connect(null, mapDispatchToProps)(CreateChannelForm)
