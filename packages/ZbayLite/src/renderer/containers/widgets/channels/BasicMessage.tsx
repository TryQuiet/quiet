import React from 'react'

import BasicMessage from '../../../components/widgets/channels/BasicMessage'
import { IBasicMessageProps } from '../../../components/widgets/channels/BasicMessage.d'

export const useBasicMessageData = () => {
  // const isOwner = useSelector(publicChannels.selectors.isOwner)

  return {
    allowModeration: false
    // allowModeration: isOwner
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
