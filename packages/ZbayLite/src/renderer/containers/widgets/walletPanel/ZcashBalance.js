import { connect } from 'react-redux'

import ZcashBalance from '../../../components/widgets/walletPanel/ZcashBalance'

import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  usdBalance: identitySelectors.balance('usd')(state),
  zecBalance: identitySelectors.balance('zec')(state),
  usdLocked: identitySelectors.lockedBalance('usd')(state),
  zecLocked: identitySelectors.lockedBalance('zec')(state)
})

export default connect(mapStateToProps)(ZcashBalance)
