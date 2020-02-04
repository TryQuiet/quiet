import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import messagesQueueHandlers from '../../../store/handlers/messagesQueue'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = (state, { contactId }) => {
  return {
    message: channelSelectors.message(state),
    inputState: channelSelectors.inputLocked(state)
  }
}

export const mapDispatchToProps = (dispatch, { contactId }) => {
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
  resetDebounce
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={e => {
        onChange(e)
        resetDebounce()
      }}
      onKeyPress={sendOnEnter}
      message={message}
      inputState={inputState}
    />
  )
}

ChannelInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  inputState: PropTypes.number.isRequired,
  message: PropTypes.string
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
