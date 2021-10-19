
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { publicChannels as pubChannels } from '@zbayapp/nectar'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
// import userSelector from '../../../store/selectors/users'
import contactsSelectors from '../../../store/selectors/contacts'
// import appSelectors from '../../../store/selectors/app'

import channelHandlers, { actions } from '../../../store/handlers/channel'
import electronStore from '../../../../shared/electronStore'
import { loadNextMessagesLimit } from '../../../../shared/static'

export const ChannelMessages = ({ contentRect }) => {
  const isDev = process.env.NODE_ENV === 'development'

  const [scrollPosition, setScrollPosition] = React.useState(-1)

  const dispatch = useDispatch()
  const contactId = useSelector(channelSelectors.id)
  const setAddress = (contactId) => dispatch(actions.setAddress(contactId))
  // const triggerScroll = qDmMessages.length + qMessages.length > 0

  const onLinkedChannel = (props) =>
    dispatch(channelHandlers.epics.linkChannelRedirect(props))
  const setDisplayableLimit = (arg0?: number) =>
    dispatch(channelHandlers.actions.setDisplayableLimit(arg0))
  // const messages = useSelector(contactsSelectors.directMessages(contactId))
  //   .visibleMessages
  const messages = useSelector(
    pubChannels.selectors.currentChannelDisplayableMessages
  )
  console.log(messages, 'messages')

  const messagesLength = useSelector(
    contactsSelectors.messagesLength(contactId)
  )
  const displayableMessageLimit = useSelector(
    channelSelectors.displayableMessageLimit
  )

  // const isOwner = useSelector(ownedChannelsSelectors.isOwner)
  const channelId = useSelector(channelSelectors.channelId)
  const users = []
  const publicChannels = useSelector(pubChannels.selectors.publicChannels)
  // const users = useSelector(userSelector.users)
  // const publicChannels = useSelector(publicChannelsSelector.publicChannels)
  // const network = useSelector(nodeSelector.network)

  useEffect(() => {
    setAddress(contactId)
  }, [contactId])

  useEffect(() => {
    setScrollPosition(-1)
  }, [channelId, contactId])
  // useEffect(() => {
  //   if (triggerScroll) {
  //     setScrollPosition(-1)
  //   }
  // }, [triggerScroll])
  useEffect(() => {
    if (scrollPosition === 0 && displayableMessageLimit < messagesLength) {
      setDisplayableLimit(displayableMessageLimit + loadNextMessagesLimit)
    }
  }, [scrollPosition])

  const usersRegistration = []
  const publicChannelsRegistration = []
  const isNewUser = electronStore.get('isNewUser')

  return (
    <ChannelMessagesComponent
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      isNewUser={isNewUser}
      channelId={channelId}
      messages={messages}
      contactId={contactId}
      contentRect={contentRect}
      // isOwner={isOwner}
      publicChannelsRegistration={publicChannelsRegistration}
      usersRegistration={usersRegistration}
      users={users}
      onLinkedChannel={onLinkedChannel}
      publicChannels={publicChannels}
      isDev={isDev}
    />
  )
}

export default ChannelMessages
