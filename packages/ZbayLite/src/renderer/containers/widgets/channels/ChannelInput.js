import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import messagesQueueHandlers from '../../../store/handlers/messagesQueue'
import mentionsHandlers from '../../../store/handlers/mentions'
import channelSelectors from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import { MESSAGE_SIZE } from '../../../zbay/transit'
import ratesSelector from '../../../store/selectors/rates'

export const mapStateToProps = state => {
  return {
    message: channelSelectors.message(state),
    inputState: channelSelectors.inputLocked(state),
    members: channelSelectors.members(state),
    channelName: channelSelectors.data(state)
      ? channelSelectors.data(state).get('name')
      : ' Unnamed',
    users: usersSelectors.users(state),
    feeUsd: ratesSelector.feeUsd(state),
    myUser: usersSelectors.myUser(state)
  }
}

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      resetDebounce: messagesQueueHandlers.epics.resetMessageDebounce,
      sendOnEnter: channelHandlers.epics.sendOnEnter,
      checkMentions: mentionsHandlers.epics.checkMentions
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
  members,
  checkMentions,
  feeUsd,
  myUser
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
      onKeyPress={e => {
        checkMentions()
        sendOnEnter(e)
      }}
      message={message}
      inputState={inputState}
      channelName={`#${channelName} as @${myUser.nickname} - $${feeUsd}`}
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
