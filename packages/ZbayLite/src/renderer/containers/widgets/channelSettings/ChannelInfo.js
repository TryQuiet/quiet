import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { rate } from '../../../store/selectors/rates'
import ChannelInfo from '../../../components/widgets/channelSettings/ChannelInfo'

import channelSelector from '../../../store/selectors/channel'
import moderationActions from '../../../store/handlers/moderationActions'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state).toNumber(),
  rateZec: 1 / rate('usd')(state),
  initialValues: {
    updateChannelDescription: channelSelector.data(state).get('description'),
    amountZec: channelSelector.advertFee(state),
    amountUsd: (
      rate('usd')(state).toNumber() * channelSelector.advertFee(state)
    ).toFixed(2),
    updateMinFee: !!channelSelector.advertFee(state),
    updateOnlyRegistered: channelSelector.onlyRegistered(state)
  }
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      updateChannelSettings: moderationActions.epics.updateChannelSettings
    },
    dispatch
  )

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  React.memo
)(ChannelInfo)
