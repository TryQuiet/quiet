import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultHandlers from '../../store/handlers/vault'
import vaultSelectors from '../../store/selectors/vault'
import VaultUnlockerForm from '../../components/widgets/VaultUnlockerForm'

export const mapStateToProps = state => ({
  unlocking: vaultSelectors.unlocking(state),
  locked: vaultSelectors.locked(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  onSubmit: vaultHandlers.epics.unlockVault
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(VaultUnlockerForm)
