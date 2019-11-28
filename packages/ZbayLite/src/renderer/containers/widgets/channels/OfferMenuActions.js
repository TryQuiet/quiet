import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { withRouter } from 'react-router-dom'
import { DateTime } from 'luxon'

import ChannelMenuActionComponent from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators } from '../../../store/handlers/modals'
import contactsHandler from '../../../store/handlers/contacts'
import dmChannelSelectors from '../../../store/selectors/directMessageChannel'
import offersSelectors from '../../../store/selectors/offers'
import ratesSelectors from '../../../store/selectors/rates'

export const mapStateToProps = (state, { offer }) => ({
  targetAddress: dmChannelSelectors.targetRecipientAddress(state),
  advert: offersSelectors.advertMessage(offer)(state),
  rateUsd: ratesSelectors.rate('usd')(state)
})

export const mapDispatchToProps = (dispatch, { history }) => {
  return bindActionCreators(
    {
      onInfo: payload => actionCreators.openModal('advertActions', payload)(),
      onMute: () => console.warn('[ChannelMenuAction] onMute not implemented'),
      onDelete: target => contactsHandler.epics.deleteChannel({ ...target, history })
    },
    dispatch
  )
}
const ChannelMenuAction = ({ onInfo, rateUsd, advert, onDelete, offer, ...props }) => {
  const payload = {
    tag: advert.message.tag,
    priceUSD: advert.message.amount,
    priceZcash: rateUsd
      .div(rateUsd.times(rateUsd))
      .times(advert.message.amount)
      .toFixed(2)
      .toString(),
    offerOwner: advert.sender.username,
    description: advert.message.description,
    title: advert.message.title,
    address: advert.sender.replyTo,
    background: advert.message.background,
    id: advert.id
  }
  return (
    <ChannelMenuActionComponent
      onInfo={() => onInfo(payload)}
      onDelete={() => onDelete({ address: offer, timestamp: parseInt(DateTime.utc().toSeconds()) })}
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
