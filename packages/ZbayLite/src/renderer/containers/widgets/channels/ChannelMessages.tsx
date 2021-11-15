
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { publicChannels as pubChannels } from '@zbayapp/nectar'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
// import userSelector from '../../../store/selectors/users'
// import appSelectors from '../../../store/selectors/app'

import channelHandlers from '../../../store/handlers/channel'
import electronStore from '../../../../shared/electronStore'
import { loadNextMessagesLimit } from '../../../../shared/static'

export const ChannelMessages = ({ contentRect }) => {
  const isDev = process.env.NODE_ENV === 'development'

  const [scrollPosition, setScrollPosition] = React.useState(-1)

  const dispatch = useDispatch()
  const messages = useSelector(
    pubChannels.selectors.currentChannelDisplayableMessages
  )
  const messagesLength = 0 // for now
  const displayableMessageLimit = 50 // for now

  const publicChannels = useSelector(pubChannels.selectors.publicChannels)
  const onLinkedChannel = (props) =>
    dispatch(channelHandlers.epics.linkChannelRedirect(props))
  const setDisplayableLimit = (arg0?: number) =>
    dispatch(channelHandlers.actions.setDisplayableLimit(arg0))
  // const messages = useSelector(contactsSelectors.directMessages(contactId))
  //   .visibleMessages
  console.log(messages, 'messages')

  // const isOwner = useSelector(ownedChannelsSelectors.isOwner)
  const users = []
  // const users = useSelector(userSelector.users)
  // const publicChannels = useSelector(publicChannelsSelector.publicChannels)
  // const network = useSelector(nodeSelector.network)

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
      messages={messages}
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
