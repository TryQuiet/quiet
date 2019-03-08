import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import WalletPanelActions from '../../../components/widgets/walletPanel/WalletPanelActions'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onSend: () => console.log('Sending money'),
  onReceive: () => console.log('Receiving money')
}, dispatch)

export default connect(null, mapDispatchToProps)(WalletPanelActions)
