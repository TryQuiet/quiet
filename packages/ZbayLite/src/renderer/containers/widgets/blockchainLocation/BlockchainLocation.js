import * as R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import BlockchainLocationModal from '../../../components/widgets/blockchainLocation/BlockchainLocation'
import appHandlers from '../../../store/handlers/app'
import { withModal } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleSelection: (userChoice) => appHandlers.epics.proceedWithSyncing(userChoice)
}, dispatch)

export default R.compose(
  connect(null, mapDispatchToProps),
  withModal('blockchainLocation')
)(BlockchainLocationModal)
