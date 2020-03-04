import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import directMessageChannel from '../../store/handlers/directMessageChannel'
import contactsHandlers from '../../store/handlers/contacts'
import channelHandlers from '../../store/handlers/channel'
import ChannelComponent from '../../components/pages/Channel'
import { CHANNEL_TYPE } from '../../components/pages/ChannelTypes'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadRecipientAddress: directMessageChannel.actions.setDirectMessageRecipientAddress,
      loadRecipientUsername: directMessageChannel.actions.setDirectMessageRecipientUsername,
      loadContact: contactsHandlers.epics.loadContact,
      resetChannel: channelHandlers.actions.resetChannel
    },
    dispatch
  )

const DirectMessages = ({
  match,
  loadRecipientUsername,
  loadRecipientAddress,
  loadContact,
  resetChannel
}) => {
  useEffect(
    () => {
      resetChannel()
      loadRecipientAddress(match.params.id)
      loadRecipientUsername(match.params.username)
      loadContact(match.params.id)
    },
    [match.params.id]
  )
  return <ChannelComponent channelType={CHANNEL_TYPE.DIRECT_MESSAGE} contactId={match.params.id} />
}

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  )
)(DirectMessages)
