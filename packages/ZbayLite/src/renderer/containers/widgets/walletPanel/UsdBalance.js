import { connect } from 'react-redux'

import UsdBalance from '../../../components/widgets/walletPanel/UsdBalance'

import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  value: identitySelectors.balance('usd')(state)
})

export default connect(mapStateToProps)(UsdBalance)
