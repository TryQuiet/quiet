import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ListingMessageComponent from '../../../components/widgets/channels/ListingMessage'
import { actionCreators } from '../../../store/handlers/modals'
import ratesSelectors from '../../../store/selectors/rates'

export const mapStateToProps = state => ({
  rateUsd: ratesSelectors.rate('usd')(state)
})
export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      buyActions: (modalName, payload) => actionCreators.openModal(modalName, payload)()
    },
    dispatch
  )
const ListingMessage = ({ message, rateUsd, ...props }) => {
  const payload = {
    tag: message.message.tag,
    description: message.message.description,
    background: message.message.background,
    title: message.message.title,
    priceZcash: message.message.amount,
    priceUSD: rateUsd.times(message.message.amount).toFixed(2).toString()
  }
  return <ListingMessageComponent payload={payload} {...props} />
}
export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ListingMessage)
