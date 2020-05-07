import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import offersHandlers from '../../../store/handlers/offers'
import channelSelectors from '../../../store/selectors/channel'
import offersSelectors from '../../../store/selectors/offers'
import ratesSelector from '../../../store/selectors/rates'
import { MESSAGE_ITEM_SIZE } from '../../../zbay/transit'
import usersSelectors from '../../../store/selectors/users'

export const mapStateToProps = (state, { offer }) => ({
  message: channelSelectors.message(state),
  inputState: channelSelectors.inputLocked(state),
  offerName: offersSelectors.offer(offer)(state).name,
  users: usersSelectors.users(state),
  feeUsd: ratesSelector.feeUsd(state),
  myUser: usersSelectors.myUser(state)
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      sendItemMessageOnEnter: offersHandlers.epics.sendItemMessageOnEnter
    },
    dispatch
  )
}
export const ChannelInput = ({
  onChange,
  sendItemMessageOnEnter,
  message,
  inputState,
  offerName,
  users,
  feeUsd,
  myUser
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const [anchorEl, setAnchorEl] = React.useState({})
  const [mentionsToSelect, setMentionsToSelect] = React.useState([])
  const nameSplit = offerName.split('@')
  const channelName = `@${nameSplit[nameSplit.length - 1]} as @${
    myUser.nickname
  } - $${feeUsd}`
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={onChange}
      onKeyPress={sendItemMessageOnEnter}
      message={message}
      inputState={inputState}
      channelName={channelName}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      mentionsToSelect={mentionsToSelect}
      setMentionsToSelect={setMentionsToSelect}
      messageLimit={MESSAGE_ITEM_SIZE}
      users={users}
    />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
