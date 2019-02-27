import { connect } from 'react-redux'

import Index from '../../components/pages/Index'
import vaultSelectors from '../../store/selectors/vault'

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  locked: vaultSelectors.locked(state)
})

export default connect(mapStateToProps)(Index)
