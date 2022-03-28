import React from 'react'
import { useSelector } from 'react-redux'

import contactsSelectors from '../../../store/selectors/contacts'
import ChannelMessagesComponent from '../../../components/widgets/channels/ChannelMessages'

import { PublicChannel } from '@quiet/nectar'

interface ChannelMessagesProps {
  contactId: string
}

export const ChannelMessages = ({ contactId }: ChannelMessagesProps) => {
  const contact = useSelector(contactsSelectors.contact(contactId)) as unknown as PublicChannel

  return <ChannelMessagesComponent username='user' channel={contact} />
}

export default ChannelMessages
