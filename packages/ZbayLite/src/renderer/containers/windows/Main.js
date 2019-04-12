import { connect } from 'react-redux'

import Main from '../../components/windows/Main'
import vaultSelectors from '../../store/selectors/vault'

export const mapStateToProps = state => ({
  locked: vaultSelectors.locked(state)
})

export default connect(mapStateToProps)(Main)
