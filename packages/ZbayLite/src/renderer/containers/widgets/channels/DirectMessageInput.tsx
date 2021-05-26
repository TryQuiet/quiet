import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import directMessagesQueueHandlers from '../../../store/handlers/directMessagesQueue'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import identitySelectors from '../../../store/selectors/identity'
import contactsSelectors from '../../../store/selectors/contacts'
import { User } from '../../../store/handlers/users'

const useChannelInputData = contactId => {
  const contact = useSelector(contactsSelectors.contact(contactId))
  const signerPubey = useSelector(identitySelectors.signerPubKey)
  const inputLocked = useSelector(channelSelectors.inputLocked)

  const data = {
    contact: contact,
    message: useSelector(channelSelectors.message),
    id: useSelector(channelSelectors.id),
    signerPubey: signerPubey,
    inputLocked: inputLocked,
    inputState: useSelector(usersSelectors.registeredUser(signerPubey)) ? inputLocked : INPUT_STATE.UNREGISTERED,
    channelName: contact.username,
    users: useSelector(usersSelectors.users),
    myUser: useSelector(usersSelectors.myUser),
    isMessageTooLong: useSelector(channelSelectors.messageSizeStatus),
    isContactConnected: contact.connected,
    isContactTyping: contact.typingIndicator,
    contactUsername: contact.username
  }

  return data
}

const useChannelInputActions = () => {
  const dispatch = useDispatch()

  const onChange = useCallback((arg: { value: string; id: string }) => {
    dispatch(channelHandlers.actions.setMessage(arg))
  }, [dispatch])

  const resetDebounce = useCallback(() => {
    dispatch(directMessagesQueueHandlers.epics.resetDebounceDirectMessage())
  }, [dispatch])

  const sendDirectMessageOnEnter = useCallback((event: React.KeyboardEvent<Element>, resetTab?: (number) => void) => {
    dispatch(channelHandlers.epics.sendOnEnter(event, resetTab))
  }, [dispatch])

  const sendTypingIndicator = useCallback((value: boolean) => {
    dispatch(channelHandlers.epics.sendTypingIndicator(value))
  }, [dispatch])

  return { onChange, resetDebounce, sendDirectMessageOnEnter, sendTypingIndicator }
}

export const ChannelInput = ({ contactId }) => {
  const [infoClass, setInfoClass] = React.useState<string>(null)
  // eslint-disable-next-line
  const [anchorEl, setAnchorEl] = React.useState({} as HTMLElement)
  const [mentionsToSelect, setMentionsToSelect] = React.useState<User[]>([])

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
  } = useChannelInputData(contactId)

  const { onChange, resetDebounce, sendDirectMessageOnEnter, sendTypingIndicator } = useChannelInputActions()

  const isFromZbayUser = channelName !== 'Unknown'
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
      inputState={isFromZbayUser ? inputState : INPUT_STATE.DISABLE}
      inputPlaceholder={`@${channelName.substring(0, 20)} as @${myUser.nickname}`}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      isMessageTooLong={isMessageTooLong}
      isDM//
      sendTypingIndicator={sendTypingIndicator}
      isContactConnected={isContactConnected}
      isContactTyping={isContactTyping}
      contactUsername={contactUsername}
    />
  )
}

export default ChannelInput
