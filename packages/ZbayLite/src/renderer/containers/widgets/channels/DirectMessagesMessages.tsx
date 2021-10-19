import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import appSelectors from '../../../store/selectors/app'
import { DisplayableMessage } from '@zbayapp/nectar/'

const useDirectMessagesMessagesData = (contactId: string) => {
  const contact = useSelector(contactsSelectors.contact(contactId))
  const data = {
    messages: [],
    name: contact.username,
    channelId: useSelector(channelSelectors.channelId),
    isInitialLoadFinished: useSelector(appSelectors.isInitialLoadFinished),
    isConnected: contact.connected
  }
  return data
}

interface ChannelMessagesProps {
  messages?: DisplayableMessage[]
  contactId: string
  channelId: string
  contentRect?: any
  triggerScroll?: boolean
  isInitialLoadFinished?: boolean
  name?: string
  isConnected?: boolean
}

export const ChannelMessages = ({
  contactId,
  contentRect,
  // triggerScroll,
  name
}: ChannelMessagesProps) => { // for now
  const [scrollPosition, setScrollPosition] = React.useState(-1)
  const { channelId, messages, isConnected, isInitialLoadFinished } = useDirectMessagesMessagesData(
    contactId
  )
  useEffect(() => {
    setScrollPosition(-1)
  }, [channelId, contactId])
  useEffect(() => {
    if (messages.length) {
      setScrollPosition(-1)
    }
  }, [messages.length])

  return (
    <ChannelMessagesComponent
      isDM
      scrollPosition={scrollPosition}
      setScrollPosition={setScrollPosition}
      messages={messages}
      contactId={contactId}
      contentRect={contentRect}
      isInitialLoadFinished={isInitialLoadFinished}
      name={name}
      isConnected={isConnected}
    />
  )
}

export default ChannelMessages
