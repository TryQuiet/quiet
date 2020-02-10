import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import messagesQueueHandlers from '../../../store/handlers/messagesQueue'
import channelSelectors from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import { MESSAGE_SIZE } from '../../../zbay/transit'

export const mapStateToProps = state => {
  return {
    message: channelSelectors.message(state),
    inputState: channelSelectors.inputLocked(state),
    members: channelSelectors.members(state),
    channelName: channelSelectors.data(state)
      ? channelSelectors.data(state).get('name')
      : ' Unnamed',
    users: usersSelectors.users(state)
  }
}

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      resetDebounce: messagesQueueHandlers.epics.resetMessageDebounce,
      sendOnEnter: channelHandlers.epics.sendOnEnter
    },
    dispatch
  )
}
export const ChannelInput = ({
  onChange,
  sendOnEnter,
  message,
  inputState,
  channelName,
  resetDebounce,
  users,
  members
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState({})
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      users={users}
      onChange={e => {
        onChange(e)
        resetDebounce()
      }}
      onKeyPress={sendOnEnter}
      message={message}
      inputState={inputState}
      channelName={`#${channelName}`}
      messageLimit={MESSAGE_SIZE}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      members={members}
    />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
