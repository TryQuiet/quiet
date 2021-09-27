import React from 'react'
import { useSelector } from 'react-redux'

import BasicMessage from '../../../components/widgets/channels/BasicMessage'
import { IBasicMessageProps } from '../../../components/widgets/channels/BasicMessage.d'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import identitySelectors from '../../../store/selectors/identity'

export const useBasicMessageData = () => {
  const isOwner = useSelector(channelSelectors.isOwner)
  const channelId = useSelector(channelSelectors.id)
  const directMessages = useSelector(contactsSelectors.directMessages(channelId))
  const channelModerators = directMessages.channelModerators
  const signerPubKey = useSelector(identitySelectors.signerPubKey)
  const isModerator = channelModerators.includes(signerPubKey)

  return {
    allowModeration: isOwner || isModerator
  }
}

export const BasicMessageContainer: React.FC<IBasicMessageProps> = ({
  message,
  setActionsOpen,
  actionsOpen,
  allowModeration
}
) => {
  allowModeration = useBasicMessageData().allowModeration

  return (
    <BasicMessage
      message={message}
      setActionsOpen={setActionsOpen}
      actionsOpen={actionsOpen}
      allowModeration={allowModeration}
    />
  )
}

export default BasicMessageContainer
