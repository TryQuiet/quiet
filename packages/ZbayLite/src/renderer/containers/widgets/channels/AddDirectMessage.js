import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import AddDirectMessage from '../../../components/widgets/channels/AddDirectMessage'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch => bindActionCreators({
  openModal: actionCreators.openModal('sendMoney')
}, dispatch)

export default connect(null, mapDispatchToProps)(AddDirectMessage)
