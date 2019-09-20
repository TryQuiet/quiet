import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import AddFunds from '../../components/windows/AddFunds'
import { actionCreators } from '../../store/handlers/modals'
import appHandlers from '../../store/handlers/app'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModal: actionCreators.openModal('topUp'),
      skip: appHandlers.actions.setNewUser
    },
    dispatch
  )

export default connect(
  null,
  mapDispatchToProps
)(AddFunds)
