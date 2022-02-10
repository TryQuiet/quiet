import React from 'react'
import { useSelector } from 'react-redux'

import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'

interface ChannelMessagesProps {
  contactId: string
}

export const ChannelMessages = ({ contactId }: ChannelMessagesProps) => {
  // const contact = useSelector(contactsSelectors.contact(contactId))
  const contact = 'contact'

  return <ChannelMessagesComponent channel={contact} />
}

export default ChannelMessages
