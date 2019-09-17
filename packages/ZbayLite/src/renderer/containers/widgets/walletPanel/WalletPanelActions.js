import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { actionCreators } from '../../../store/handlers/modals'
import WalletPanelActions from '../../../components/widgets/walletPanel/WalletPanelActions'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSend: actionCreators.openModal('sendMoney'),
      onReceive: actionCreators.openModal('topUp')
    },
    dispatch
  )

export default connect(
  null,
  mapDispatchToProps
)(WalletPanelActions)
