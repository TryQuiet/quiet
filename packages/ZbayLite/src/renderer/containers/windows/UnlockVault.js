import { connect } from 'react-redux'

import UnlockVault from '../../components/windows/UnlockVault'
import vaultSelectors from '../../store/selectors/vault'

export const mapStateToProps = state => ({
  locked: vaultSelectors.locked(state)
})

export default connect(mapStateToProps)(UnlockVault)
