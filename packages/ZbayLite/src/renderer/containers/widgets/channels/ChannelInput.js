import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import contactsHandlers from '../../../store/handlers/contacts'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  message: channelSelectors.message(state)
})

export const mapDispatchToProps = (dispatch, { contactId }) =>
  bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      onKeyPress: contactId
        ? contactsHandlers.epics.sendDirectMessageOnEnter
        : channelHandlers.epics.sendOnEnter
    },
    dispatch
  )
export const ChannelInput = ({ onChange, onKeyPress, message, inputState }) => {
  const [infoClass, setInfoClass] = React.useState(null)
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={onChange}
      onKeyPress={onKeyPress}
      message={message}
      inputState={inputState}
    />
  )
}

ChannelInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  inputState: PropTypes.number.isRequired,
  message: PropTypes.string
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelInput)
