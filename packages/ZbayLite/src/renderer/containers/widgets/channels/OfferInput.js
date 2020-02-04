import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import ChannelInputComponent from '../../../components/widgets/channels/ChannelInput'
import channelHandlers from '../../../store/handlers/channel'
import offersHandlers from '../../../store/handlers/offers'
import channelSelectors from '../../../store/selectors/channel'
import offersSelectors from '../../../store/selectors/offers'
import { MESSAGE_ITEM_SIZE } from '../../../zbay/transit'

export const mapStateToProps = (state, { offer }) => ({
  message: channelSelectors.message(state),
  inputState: channelSelectors.inputLocked(state),
  offerName: offersSelectors.offer(offer)(state).name
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
  offerName
}) => {
  const [infoClass, setInfoClass] = React.useState(null)
  const nameSplit = offerName.split('@')
  const channelName = `@${nameSplit[nameSplit.length - 1]}`
  return (
    <ChannelInputComponent
      infoClass={infoClass}
      setInfoClass={setInfoClass}
      onChange={onChange}
      onKeyPress={sendItemMessageOnEnter}
      message={message}
      inputState={inputState}
      channelName={channelName}
      messageLimit={MESSAGE_ITEM_SIZE}
    />
  )
}

ChannelInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  inputState: PropTypes.number.isRequired,
  message: PropTypes.string
}

export default connect(mapStateToProps, mapDispatchToProps)(ChannelInput)
