import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { actionCreators } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import WalletPanelActions from '../../../components/widgets/walletPanel/WalletPanelActions'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'

export const mapStateToProps = (state) => {
  return {
    showDepositInfo: channelSelectors.inputLocked(state) === INPUT_STATE.DISABLE || channelSelectors.inputLocked(state) === INPUT_STATE.LOCKED
  }
}
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
  mapStateToProps,
  mapDispatchToProps
)(WalletPanelActions)
