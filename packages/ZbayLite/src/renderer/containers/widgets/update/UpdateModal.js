import * as R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import UpdateModal from '../../../components/widgets/update/UpdateModal'
import updateHandlers from '../../../store/handlers/update'
import { withModal } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleUpdate: updateHandlers.epics.startApplicationUpdate,
  rejectUpdate: updateHandlers.epics.declineUpdate
}, dispatch)

export default R.compose(
  connect(null, mapDispatchToProps),
  withModal('applicationUpdate')
)(UpdateModal)
