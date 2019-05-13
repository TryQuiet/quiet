import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import AddChannelAction from '../../../components/widgets/channels/AddChannelAction'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch => bindActionCreators({
  openCreateModal: actionCreators.openModal('createChannel')
}, dispatch)

export default connect(null, mapDispatchToProps)(AddChannelAction)
