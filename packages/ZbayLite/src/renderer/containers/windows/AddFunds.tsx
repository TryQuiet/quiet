import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import AddFunds from '../../components/windows/AddFunds'
import { actionCreators } from '../../store/handlers/modals'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModal: actionCreators.openModal('topUp')
    },
    dispatch
  )

export default connect(
  null,
  mapDispatchToProps
)(AddFunds)
