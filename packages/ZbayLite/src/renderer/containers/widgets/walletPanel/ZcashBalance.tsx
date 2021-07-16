import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import electronStore from '../../../../shared/electronStore'
import ZcashBalance from '../../../components/widgets/walletPanel/ZcashBalance'
// import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = _state => ({
  // usdBalance: identitySelectors
  //   .balance('usd')(state)
  //   .plus(identitySelectors.lockedBalance('usd')(state)),
  zecBalance: electronStore.get('balance')
  //   .balance('zec')(state)
  //   .plus(identitySelectors.lockedBalance('zec')(state)),
  // usdLocked: identitySelectors.lockedBalance('usd')(state),
  // zecLocked: identitySelectors.lockedBalance('zec')(state)
})

export default R.compose(
  React.memo,
  connect(mapStateToProps)
)(ZcashBalance)
