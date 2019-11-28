import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import offersHandlers from '../../../store/handlers/offers'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  message: channelSelectors.message(state),
  inputState: channelSelectors.inputLocked(state)
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
export const ChannelInput = ({ onChange, sendItemMessageOnEnter, message, inputState }) => {
  const [infoClass, setInfoClass] = React.useState(null)
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={onChange}
      onKeyPress={sendItemMessageOnEnter}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelInput)
