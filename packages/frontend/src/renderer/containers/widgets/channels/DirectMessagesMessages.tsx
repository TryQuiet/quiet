import React from 'react'
import { useSelector } from 'react-redux'

import contactsSelectors from '../../../store/selectors/contacts'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'

interface ChannelMessagesProps {
  contactId: string
}

export const ChannelMessages = ({ contactId }: ChannelMessagesProps) => {
  const contact = useSelector(contactsSelectors.contact(contactId))

  return <ChannelMessagesComponent channel={contact.address} />
}

export default ChannelMessages
