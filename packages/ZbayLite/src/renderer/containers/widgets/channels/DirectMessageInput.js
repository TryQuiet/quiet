import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import directMessagesQueueHandlers from '../../../store/handlers/directMessagesQueue'
import contactsHandlers from '../../../store/handlers/contacts'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import identitySelectors from '../../../store/selectors/identity'
import contactsSelectors from '../../../store/selectors/contacts'
import { MESSAGE_SIZE } from '../../../zbay/transit'

export const mapStateToProps = (state, { contactId }) => ({
  message: channelSelectors.message(state),
  inputState: usersSelectors.registeredUser(
    identitySelectors.signerPubKey(state)
  )(state)
    ? channelSelectors.inputLocked(state)
    : INPUT_STATE.UNREGISTERED,
  channelName: contactsSelectors.contact(contactId)(state).username,
  users: usersSelectors.users(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      sendDirectMessageOnEnter: contactsHandlers.epics.sendDirectMessageOnEnter,
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
  users
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState({})
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={e => {
        onChange(e)
        resetDebounce()
      }}
      onKeyPress={sendDirectMessageOnEnter}
      message={message}
      inputState={inputState}
      channelName={`@${channelName}`}
      messageLimit={MESSAGE_SIZE}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      users={users}
    />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
