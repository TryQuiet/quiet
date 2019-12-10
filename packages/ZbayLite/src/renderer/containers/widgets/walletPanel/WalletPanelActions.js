import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { actionCreators } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import WalletPanelActions from '../../../components/widgets/walletPanel/WalletPanelActions'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import modalsSelectors from '../../../store/selectors/modals'

export const mapStateToProps = (state) => {
  return {
    showDepositInfo: (channelSelectors.inputLocked(state) === INPUT_STATE.DISABLE || channelSelectors.inputLocked(state) === INPUT_STATE.LOCKED) && !modalsSelectors.open('depositMoney')(state)
  }
}
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSend: actionCreators.openModal('sendMoney'),
      onReceive: actionCreators.openModal('accountSettingsModal'),
      openDepositMonet: actionCreators.openModal('depositMoney'),
      setTabToOpen: () => actions.setModalTab('addFunds')
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletPanelActions)
