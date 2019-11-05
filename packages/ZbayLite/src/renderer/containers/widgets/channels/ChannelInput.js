import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import offersHandlers from '../../../store/handlers/offers'
import contactsHandlers from '../../../store/handlers/contacts'
import channelSelectors, { INPUT_STATE } from '../../../store/selectors/channel'
import usersSelectors from '../../../store/selectors/users'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = (state, { contactId }) => {
  const registered = contactId
    ? !!usersSelectors.registeredUser(identitySelectors.signerPubKey(state))(state)
    : true
  return {
    message: channelSelectors.message(state),
    inputState: registered ? channelSelectors.inputLocked(state) : INPUT_STATE.UNREGISTERED,
    isOffer: channelSelectors.channelId(state) === contactId
  }
}

export const mapDispatchToProps = (dispatch, { contactId }) => {
  return bindActionCreators(
    {
      onChange: channelHandlers.actions.setMessage,
      sendItemMessageOnEnter: offersHandlers.epics.sendItemMessageOnEnter,
      sendDirectMessageOnEnter: contactsHandlers.epics.sendDirectMessageOnEnter,
      sendOnEnter: channelHandlers.epics.sendOnEnter
    },
    dispatch
  )
}
export const ChannelInput = ({
  onChange,
  sendItemMessageOnEnter,
  sendDirectMessageOnEnter,
  sendOnEnter,
  contactId,
  isOffer,
  message,
  inputState
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const onKeyPress = contactId
    ? isOffer
      ? sendItemMessageOnEnter
      : sendDirectMessageOnEnter
    : sendOnEnter
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
