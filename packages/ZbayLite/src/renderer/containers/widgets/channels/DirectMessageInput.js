import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import directMessagesQueueHandlers from '../../../store/handlers/directMessagesQueue'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import identitySelectors from '../../../store/selectors/identity'
import contactsSelectors from '../../../store/selectors/contacts'
import { MESSAGE_SIZE } from '../../../zbay/transit'
import messagesHandlers from '../../../store/handlers/messages'

export const mapStateToProps = (state, { contactId }) => {
  const contact = contactsSelectors.contact(contactId)(state)
  return {
    contactId: contactId,
    message: channelSelectors.message(state),
    id: channelSelectors.id(state),
    inputState: usersSelectors.registeredUser(identitySelectors.signerPubKey(state))(state)
      ? channelSelectors.inputLocked(state)
      : INPUT_STATE.UNREGISTERED,
    channelName: contactsSelectors.contact(contactId)(state).username,
    users: usersSelectors.users(state),
    myUser: usersSelectors.myUser(state),
    isSizeCheckingInProgress: channelSelectors.isSizeCheckingInProgress(state),
    isMessageTooLong: channelSelectors.messageSizeStatus(state),
    isContactConnected: contact.connected,
    isContactTyping: contact.typingIndicator,
    contactUsername: contact.username
  }
}

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      sendDirectMessageOnEnter: channelHandlers.epics.sendOnEnter,
      checkMessageSizeLimit: messagesHandlers.epics.checkMessageSize,
      sendTypingIndicator: channelHandlers.epics.sendTypingIndicator,
      resetDebounce:
        directMessagesQueueHandlers.epics.resetDebounceDirectMessage
    },
    dispatch
  )
}
export const ChannelInput = ({
  onChange,
  sendDirectMessageOnEnter,
  message,
  inputState,
  channelName,
  resetDebounce,
  users,
  myUser,
  isMessageTooLong,
  isSizeCheckingInProgress,
  id,
  isContactConnected,
  sendTypingIndicator,
  isContactTyping,
  contactUsername
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState({})
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])
  const isFromZbayUser = channelName !== 'Unknown'
  return (
    <ChannelInputComponent
      isDM
      infoClass={infoClass}
      id={id}
      setInfoClass={setInfoClass}
      onChange={e => {
        onChange({ value: e, id })
        resetDebounce()
      }}
      onKeyPress={sendDirectMessageOnEnter}
      message={message}
      inputState={isFromZbayUser ? inputState : INPUT_STATE.DISABLE}
      inputPlaceholder={`@${channelName.substring(0, 20)} as @${myUser.nickname}`}
      messageLimit={MESSAGE_SIZE}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      users={users}
      isMessageTooLong={isMessageTooLong}
      isSizeCheckingInProgress={isSizeCheckingInProgress}
      isContactConnected={isContactConnected}
      sendTypingIndicator={sendTypingIndicator}
      isContactTyping={isContactTyping}
      contactUsername={contactUsername}
    />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
