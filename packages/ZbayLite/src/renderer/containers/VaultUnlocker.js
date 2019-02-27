import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultUnlockerSelectors from '../store/selectors/vaultUnlocker'
import vaultUnlockerHandlers from '../store/handlers/vaultUnlocker'
import vaultHandlers from '../store/handlers/vault'
import vaultSelectors from '../store/selectors/vault'
import VaultUnlocker from '../components/VaultUnlocker'

export const mapStateToProps = state => ({
  passwordVisible: vaultUnlockerSelectors.passwordVisible(state),
  password: vaultUnlockerSelectors.password(state),
  unlocking: vaultSelectors.unlocking(state),
  error: vaultSelectors.error(state),
  locked: vaultSelectors.locked(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  onClick: vaultUnlockerHandlers.epics.unlockVault,
  onCloseSnackbar: vaultHandlers.actions.clearError,
  handleTogglePassword: vaultUnlockerHandlers.actions.togglePasswordVisibility,
  handleSetPassword: vaultUnlockerHandlers.actions.setPassword
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(VaultUnlocker)
