import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { actionCreators } from '../../../store/handlers/modals'
import ItemTransferMessageComponent from '../../../components/widgets/channels/ItemTransferMessage'
import ratesSelectors from '../../../store/selectors/rates'

const mapStateToProps = state => ({
  rateUsd: ratesSelectors.rate('usd')(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openSentModal: payload =>
        actionCreators.openModal('sentFunds', payload)()
    },
    dispatch
  )
export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps)
)(ItemTransferMessageComponent)
