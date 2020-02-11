import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import ChannelContent from '../../../components/widgets/channels/ChannelContent'
import channelSelectors from '../../../store/selectors/channel'
import identitySelectors from '../../../store/selectors/identity'
import mentionsSelectors from '../../../store/selectors/mentions'
import mentionsHandlers from '../../../store/handlers/mentions'

export const mapStateToProps = state => ({
  inputState: channelSelectors.inputLocked(state),
  signerPubKey: identitySelectors.signerPubKey(state),
  mentions: mentionsSelectors.mentions(state),
  channelId: channelSelectors.channelId(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      removeMention: mentionsHandlers.epics.removeMention,
      sendInvitation: mentionsHandlers.epics.sendInvitation
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps)
)(ChannelContent)
