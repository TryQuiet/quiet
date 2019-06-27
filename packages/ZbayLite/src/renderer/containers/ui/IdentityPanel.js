import { connect } from 'react-redux'

import IdentityPanel from '../../components/ui/IdentityPanel'

import identitySelectors from '../../store/selectors/identity'

export const mapStateToProps = state => ({
  identity: identitySelectors.data(state),
  loader: identitySelectors.loader(state)
})

export default connect(mapStateToProps)(IdentityPanel)
