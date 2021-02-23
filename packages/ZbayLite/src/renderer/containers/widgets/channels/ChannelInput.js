import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import messagesHandlers from '../../../store/handlers/messages'
import messagesQueueHandlers from '../../../store/handlers/messagesQueue'
import mentionsHandlers from '../../../store/handlers/mentions'
import channelSelectors from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import { MESSAGE_SIZE } from '../../../zbay/transit'

export const mapStateToProps = state => {
  return {
    message: channelSelectors.message(state),
    id: channelSelectors.id(state),
    inputState: channelSelectors.inputLocked(state),
    members: channelSelectors.members(state),
    channelName: channelSelectors.data(state)
      ? channelSelectors.data(state).username
      : ' Unnamed',
    users: usersSelectors.users(state),
    myUser: usersSelectors.myUser(state),
    isSizeCheckingInProgress: channelSelectors.isSizeCheckingInProgress(state),
    isMessageTooLong: channelSelectors.messageSizeStatus(state)
  }
}

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      resetDebounce: messagesQueueHandlers.epics.resetMessageDebounce,
      sendOnEnter: channelHandlers.epics.sendOnEnter,
      checkMentions: mentionsHandlers.epics.checkMentions,
      checkMessageSizeLimit: messagesHandlers.epics.checkMessageSize
    },
    dispatch
  )
}
export const ChannelInput = ({
  onChange,
  setTab,
  sendOnEnter,
  message,
  inputState,
  channelName,
  resetDebounce,
  users,
  members,
  checkMentions,
  myUser,
  isPublicChannel,
  isMessageTooLong,
  isSizeCheckingInProgress,
  id
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState({})
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])
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
      onKeyPress={(e) => {
        checkMentions()
        sendOnEnter(e, setTab)
      }}
      isPublicChannel={isPublicChannel}
      message={message}
      inputState={inputState}
      inputPlaceholder={`#${channelName} as @${myUser.nickname}`}
      channelName={channelName}
      messageLimit={MESSAGE_SIZE}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      members={members}
      isMessageTooLong={isMessageTooLong}
      isSizeCheckingInProgress={isSizeCheckingInProgress}
    />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
