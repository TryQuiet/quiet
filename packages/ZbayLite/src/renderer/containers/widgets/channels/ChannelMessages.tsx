import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as R from 'ramda'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import dmQueueMessages from '../../../store/selectors/directMessagesQueue'
import queueMessages from '../../../store/selectors/messagesQueue'
import userSelector from '../../../store/selectors/users'
import contactsSelectors from '../../../store/selectors/contacts'
import nodeSelector from '../../../store/selectors/node'
import appSelectors from '../../../store/selectors/app'
import ownedChannelsSelectors from '../../../store/selectors/ownedChannels'
import publicChannelsSelector from '../../../store/selectors/publicChannels'
import { MessageType } from '../../../../shared/static.types'
import zcashChannels from '../../../zcash/channels'
import channelHandlers, { actions } from '../../../store/handlers/channel'
import appHandlers from '../../../store/handlers/app'

import electronStore from '../../../../shared/electronStore'
import { loadNextMessagesLimit } from '../../../../shared/static'

export const ChannelMessages = ({ tab, contentRect }) => {
  const isDev = process.env.NODE_ENV === 'development'

  const [scrollPosition, setScrollPosition] = React.useState(-1)
  const [_isRescanned, setIsRescanned] = React.useState(true)
  const [newMessagesLoading, setNewMessagesLoading] = React.useState(false)

  const dispatch = useDispatch()
  const qMessages = useSelector(queueMessages.queue)
  const qDmMessages = useSelector(dmQueueMessages.queue)
  const contactId = useSelector(channelSelectors.id)
  const setAddress = (contactId) => dispatch(actions.setAddress(contactId))
  const triggerScroll = qDmMessages.length + qMessages.length > 0

  const onLinkedChannel = (props) =>
    dispatch(channelHandlers.epics.linkChannelRedirect(props))
  const setDisplayableLimit = (arg0?: number) =>
    dispatch(channelHandlers.actions.setDisplayableLimit(arg0))
  const onRescan = () => dispatch(appHandlers.epics.restartAndRescan())
  const messages = useSelector(contactsSelectors.directMessages(contactId))
    .visibleMessages
  const messagesLength = useSelector(
    contactsSelectors.messagesLength(contactId)
  )
  const displayableMessageLimit = useSelector(
    channelSelectors.displayableMessageLimit
  )
  const isOwner = useSelector(ownedChannelsSelectors.isOwner)
  const channelId = useSelector(channelSelectors.channelId)
  const users = useSelector(userSelector.users)
  const loader = useSelector(channelSelectors.loader)
  const publicChannels = useSelector(publicChannelsSelector.publicChannels)
  const network = useSelector(nodeSelector.network)
  const isInitialLoadFinished = useSelector(appSelectors.isInitialLoadFinished)

  useEffect(() => {
    setAddress(contactId)
  }, [contactId])

  useEffect(() => {
    setScrollPosition(-1)
    setIsRescanned(!electronStore.get(`channelsToRescan.${channelId}`))
  }, [channelId, contactId])
  useEffect(() => {
    if (triggerScroll) {
      setScrollPosition(-1)
    }
  }, [triggerScroll])
  useEffect(() => {
    if (scrollPosition === 0 && displayableMessageLimit < messagesLength) {
      setDisplayableLimit(displayableMessageLimit + loadNextMessagesLimit)
      setNewMessagesLoading(true)
    }
  }, [scrollPosition])

  const oldestMessage = messages ? messages[messages.length - 1] : null
  let usersRegistration = []
  let _publicChannelsRegistration = []
  let publicChannelsRegistration
  if (channelId === zcashChannels.general[network].address) {
    if (oldestMessage) {
      usersRegistration = Array.from(Object.values(users)).filter(
        (msg) => msg.createdAt >= oldestMessage.createdAt
      )
      _publicChannelsRegistration = Array.from(Object.values(publicChannels)).filter(
        msg => msg.timestamp >= oldestMessage.createdAt
      )
      publicChannelsRegistration = R.clone(_publicChannelsRegistration)
      for (const ch of publicChannelsRegistration) {
        delete Object.assign(ch, { createdAt: parseInt(ch.timestamp) }).timestamp
      }
    }
  }
  const isNewUser = electronStore.get('isNewUser')

  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      newMessagesLoading={newMessagesLoading}
      setNewMessagesLoading={setNewMessagesLoading}
      isNewUser={isNewUser}
      onRescan={onRescan}
      channelId={channelId}
      messages={
        tab === 0
          ? messages
          : messages.filter((msg) => msg.type === MessageType.AD)
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
      isDev={isDev}
    />
  )
}

export default ChannelMessages
