import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultCreatorSelectors from '../store/selectors/vaultCreator'
import vaultCreatorHandlers from '../store/handlers/vaultCreator'
import vaultSelectors from '../store/selectors/vault'
import VaultCreator from '../components/VaultCreator'

export const mapStateToProps = state => ({
  passwordVisible: vaultCreatorSelectors.passwordVisible(state),
  repeatVisible: vaultCreatorSelectors.repeatVisible(state),
  password: vaultCreatorSelectors.password(state),
  repeat: vaultCreatorSelectors.repeat(state),
  loading: vaultSelectors.creating(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  onSend: vaultCreatorHandlers.epics.createVault,
  handleTogglePassword: vaultCreatorHandlers.actions.togglePasswordVisibility,
  handleToggleRepeat: vaultCreatorHandlers.actions.toggleRepeatVisibility,
  handleSetPassword: vaultCreatorHandlers.actions.setPassword,
  handleSetRepeat: vaultCreatorHandlers.actions.setRepeat
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(VaultCreator)
