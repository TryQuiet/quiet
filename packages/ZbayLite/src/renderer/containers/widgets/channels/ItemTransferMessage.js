import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { actionCreators } from '../../../store/handlers/modals'
import ItemTransferMessageComponent from '../../../components/widgets/channels/ItemTransferMessage'
import ratesSelectors from '../../../store/selectors/rates'
import nodeSelector from '../../../store/selectors/node'

const mapStateToProps = state => ({
  rateUsd: ratesSelectors.rate('usd')(state),
  currentBlock: parseInt(nodeSelector.currentBlock(state))
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
