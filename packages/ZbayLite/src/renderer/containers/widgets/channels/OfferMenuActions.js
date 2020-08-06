import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { withRouter } from 'react-router-dom'

import ChannelMenuActionComponent from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators } from '../../../store/handlers/modals'
import dmChannelSelectors from '../../../store/selectors/directMessageChannel'
import importedChannelHandler from '../../../store/handlers/importedChannel'
// import offersSelectors from '../../../store/selectors/offers'
import ratesSelectors from '../../../store/selectors/rates'

export const mapStateToProps = (state, { offer }) => ({
  targetAddress: dmChannelSelectors.targetRecipientAddress(state),
  // advert: offersSelectors.advertMessage(offer)(state),
  rateUsd: ratesSelectors.rate('usd')(state)
})

export const mapDispatchToProps = (dispatch, { history }) => {
  return bindActionCreators(
    {
      onInfo: payload => actionCreators.openModal('advertActions', payload)(),
      onMute: () => console.warn('[ChannelMenuAction] onMute not implemented'),
      onDelete: () => importedChannelHandler.epics.removeChannel(history, true)
    },
    dispatch
  )
}
const ChannelMenuAction = ({ onInfo, rateUsd, advert, onDelete, offer, ...props }) => {
  const payload = {
    // tag: advert.message.tag,
    // priceUSD: advert.message.amount,
    // priceZcash: rateUsd
    //   .div(rateUsd.times(rateUsd))
    //   .times(advert.message.amount)
    //   .toFixed(2)
    //   .toString(),
    // offerOwner: advert.sender.username,
    // description: advert.message.description,
    // title: advert.message.title,
    // address: advert.sender.replyTo,
    // background: advert.message.background,
    // id: advert.id
  }
  return (
    <ChannelMenuActionComponent
      onInfo={() => onInfo(payload)}
      onDelete={onDelete}
      disableSettings
      {...props}
    />
  )
}
export default R.compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ChannelMenuAction)
