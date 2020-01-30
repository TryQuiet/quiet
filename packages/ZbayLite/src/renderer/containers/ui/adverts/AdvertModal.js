import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { withModal } from '../../../store/handlers/modals'
import AdvertFormComponent from '../../../components/ui/adverts/AdvertForm'
import { rate } from '../../../store/selectors/rates'
import identitySelector from '../../../store/selectors/identity'
import channelSelector from '../../../store/selectors/channel'
import advertHandlers from '../../../store/handlers/adverts'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  rateZec: 1 / rate('usd')(state),
  balanceZec: identitySelector.balance('zec')(state),
  minFee: channelSelector.advertFee(state)
})

export const SendMoneyModal = props => {
  return <AdvertFormComponent {...props} />
}
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      handleSend: advertHandlers.epics.handleSend
    },
    dispatch
  )

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('advert'),
  React.memo
)(SendMoneyModal)
