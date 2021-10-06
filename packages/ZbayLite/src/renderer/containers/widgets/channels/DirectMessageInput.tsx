import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
// import directMessagesQueueHandlers from '../../../store/handlers/directMessagesQueue'
import channelSelectors from '../../../store/selectors/channel'
// import usersSelectors from '../../../store/selectors/users'
// import identitySelectors from '../../../store/selectors/identity'
import contactsSelectors from '../../../store/selectors/contacts'
// import { User } from '../../../store/handlers/users'
// import { directMessagesActions } from '../../../sagas/directMessages/directMessages.reducer'

export const useDirectMessageInputData = contactId => {
  const contact = useSelector(contactsSelectors.contact(contactId))
  // const signerPubey = useSelector(identitySelectors.signerPubKey)
  const inputLocked = useSelector(channelSelectors.inputLocked)

  const data = {
    contact: contact,
    message: useSelector(channelSelectors.message),
    id: useSelector(channelSelectors.id),
    // signerPubey: signerPubey,
    // inputState: useSelector(usersSelectors.registeredUser(signerPubey)) ? inputLocked : INPUT_STATE.USER_NOT_REGISTERED,
    // users: useSelector(usersSelectors.users),
    // myUser: useSelector(usersSelectors.myUser),
    signerPubey: 'mock',
    inputState: inputLocked,
    users: [],
    myUser: { nickname: '' },
    inputLocked: inputLocked,
    channelName: contact.username,
    isMessageTooLong: useSelector(channelSelectors.messageSizeStatus),
    isContactConnected: contact.connected,
    isContactTyping: contact.typingIndicator,
    contactUsername: contact.username
  }
  return data
}

export const useDirectMessageInputActions = () => {
  const dispatch = useDispatch()

  const onChange = useCallback((arg: { value: string; id: string }) => {
    dispatch(channelHandlers.actions.setMessage(arg))
  }, [dispatch])

  const resetDebounce = useCallback(() => {
    // dispatch(directMessagesQueueHandlers.epics.resetDebounceDirectMessage())
  }, [dispatch])

  const sendDirectMessageOnEnter = useCallback(() => {
    // dispatch(directMessagesActions.sendDirectMessage())
  }, [dispatch])

  return { onChange, resetDebounce, sendDirectMessageOnEnter }
}

export const ChannelInput = ({ contactId }) => {
  const [infoClass, setInfoClass] = React.useState<string>(null)

  const {
    channelName,
    contactUsername,
    id,
    inputState,
    isContactConnected,
    isContactTyping,
    isMessageTooLong,
    message,
    myUser,
    users
  } = useDirectMessageInputData(contactId)

  const { onChange, resetDebounce, sendDirectMessageOnEnter } = useDirectMessageInputActions()

  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      id={id}
      users={users}
      onChange={e => {
        onChange({ value: e, id })
        resetDebounce()
      }}
      onKeyPress={sendDirectMessageOnEnter}
      message={message}
      inputState={inputState}
      inputPlaceholder={`@${channelName.substring(0, 20)} as @${myUser.nickname}`}

      isMessageTooLong={isMessageTooLong}
      isDM
      isContactConnected={isContactConnected}
      isContactTyping={isContactTyping}
      contactUsername={contactUsername}
    />
  )
}

export default ChannelInput
