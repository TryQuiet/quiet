import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import contactsHandlers from '../../../store/handlers/contacts'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = (state, { contactId }) => ({
  message: channelSelectors.message(state),
  inputState: usersSelectors.registeredUser(identitySelectors.signerPubKey(state))(state)
    ? channelSelectors.inputLocked(state)
    : INPUT_STATE.UNREGISTERED
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      sendDirectMessageOnEnter: contactsHandlers.epics.sendDirectMessageOnEnter
    },
    dispatch
  )
}
export const ChannelInput = ({ onChange, sendDirectMessageOnEnter, message, inputState }) => {
  const [infoClass, setInfoClass] = React.useState(null)
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={onChange}
      onKeyPress={sendDirectMessageOnEnter}
      message={message}
      inputState={inputState}
    />
  )
}

ChannelInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  sendDirectMessageOnEnter: PropTypes.func.isRequired,
  inputState: PropTypes.number.isRequired,
  message: PropTypes.string
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelInput)
