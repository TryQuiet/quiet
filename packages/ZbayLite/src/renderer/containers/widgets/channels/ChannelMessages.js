import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import Immutable from 'immutable'
import { bindActionCreators } from 'redux'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import channelsSelectors from '../../../store/selectors/channels'
import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
import queueMessages from '../../../store/selectors/messagesQueue'
import userSelector from '../../../store/selectors/users'
import nodeSelector from '../../../store/selectors/node'
import appSelectors from '../../../store/selectors/app'
import publicChannelsSelector from '../../../store/selectors/publicChannels'
import { messageType } from '../../../../shared/static'
import channels from '../../../zcash/channels'
import channelHandlers from '../../../store/handlers/channel'

export const mapStateToProps = (state, { signerPubKey }) => {
  const qMessages = queueMessages.queue(state)
  const qDmMessages = dmQueueMessages.queue(state)
  return {
    triggerScroll: qDmMessages.size + qMessages.size > 0,
    qMessages: qMessages,
    channelData:
      channelsSelectors.channelById(channelSelectors.channelId(state))(state) ||
      Immutable.fromJS({ keys: {} }),
    messages: channelSelectors.messages(signerPubKey)(state),
    channelId: channelSelectors.channelId(state),
    users: userSelector.users(state),
    loader: channelSelectors.loader(state),
    publicChannels: publicChannelsSelector.publicChannels(state),
    network: nodeSelector.network(state),
    isInitialLoadFinished: appSelectors.isInitialLoadFinished(state)
  }
}
export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      onLinkedChannel: channelHandlers.epics.linkChannelRedirect
    },
    dispatch
  )
export const ChannelMessages = ({
  messages,
  tab,
  contactId,
  channelId,
  contentRect,
  triggerScroll,
  channelData,
  users,
  network,
  publicChannels,
  onLinkedChannel,
  isInitialLoadFinished,
  loader
}) => {
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  useEffect(() => {
    setScrollPosition(-1)
  }, [channelId, contactId])
  useEffect(() => {
    if (triggerScroll) {
      setScrollPosition(-1)
    }
  }, [triggerScroll])
  const isOwner = !!channelData.get('keys').get('sk')
  let usersRegistration = []
  let publicChannelsRegistration = []
  if (channelData.get('address') === channels.general[network].address) {
    usersRegistration = Array.from(users.values())
    publicChannelsRegistration = Array.from(
      Object.values(publicChannels.toJS())
    )
    for (const ch of publicChannelsRegistration) {
      delete Object.assign(ch, { createdAt: parseInt(ch['timestamp']) })['timestamp']
    }
  }
  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={
        tab === 0
          ? messages
          : messages.filter(msg => msg.type === messageType.AD)
      }
      contactId={contactId}
      contentRect={contentRect}
      isOwner={isOwner}
      publicChannelsRegistration={publicChannelsRegistration}
      usersRegistration={usersRegistration}
      users={users}
      onLinkedChannel={onLinkedChannel}
      publicChannels={publicChannels}
      isInitialLoadFinished={loader.loading ? false : isInitialLoadFinished}
    />
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(
  React.memo(ChannelMessages, (before, after) => {
    return (
      Immutable.is(before.messages, after.messages) &&
      before.tab === after.tab &&
      before.isInitialLoadFinished === after.isInitialLoadFinished &&
      Immutable.is(before.users, after.users) &&
      Immutable.is(before.publicChannels, after.publicChannels)
    )
  })
)
