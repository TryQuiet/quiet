import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import CreateVault from '../../components/pages/CreateVault'
import vaultSelectors from '../../store/selectors/vault'
import vaultHandlers from '../../store/handlers/vault'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onCloseSnackbar: vaultHandlers.actions.clearError
}, dispatch)

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  locked: vaultSelectors.locked(state),
  error: vaultSelectors.error(state),
  unlocking: vaultSelectors.unlocking(state),
  loading: vaultSelectors.creating(state)
})

export const CreateVaultWrapper = ({
  exists,
  locked,
  error,
  unlocking,
  loading,
  onCloseSnackbar
}) => (
  <CreateVault
    inProgress={loading || unlocking}
    inProgressMsg={loading ? 'loading' : 'creating'}
    finished={exists && !locked}
    error={error}
    onCloseSnackbar={onCloseSnackbar}
  />
)

export default connect(mapStateToProps, mapDispatchToProps)(CreateVaultWrapper)
