import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultHandlers from '../store/handlers/vault'
import VaultCreator from '../components/VaultCreator'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onSend: vaultHandlers.epics.createVault
}, dispatch)

export default connect(null, mapDispatchToProps)(VaultCreator)
