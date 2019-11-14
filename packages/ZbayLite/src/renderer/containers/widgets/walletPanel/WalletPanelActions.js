import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { actionCreators } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import WalletPanelActions from '../../../components/widgets/walletPanel/WalletPanelActions'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSend: actionCreators.openModal('sendMoney'),
      onReceive: actionCreators.openModal('accountSettingsModal'),
      setTabToOpen: () => actions.setModalTab('addFunds')
    },
    dispatch
  )

export default connect(
  null,
  mapDispatchToProps
)(WalletPanelActions)
