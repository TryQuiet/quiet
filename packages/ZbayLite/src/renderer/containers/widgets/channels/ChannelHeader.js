import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'
import channelsHandlers from '../../../store/handlers/channels'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'

import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
import identitySelectors from '../../../store/selectors/identity'
import notificationCenter from '../../../store/selectors/notificationCenter'

import { messageType, notificationFilterType } from '../../../../shared/static'

export const mapStateToProps = (state, props) => {
  const contact = contactsSelectors.contact(props.contactId)(state)
  return {
    channel: {
      name: props.contactId === 'general' ? 'zbay' : contact.username,
      address: props.contactId
    },
    name: contact.username,
    userAddress: identitySelectors.address(state),
    members: channelSelectors.channelParticipiants(state),
    showAdSwitch: !!contactsSelectors
      .messages(props.contactId)(state)
      .find(msg => msg.type === messageType.AD),
    mutedFlag:
      notificationCenter.channelFilterById(
        channelSelectors.data(state) ? channelSelectors.data(state).key : 'none'
      )(state) === notificationFilterType.MUTE
  }
}
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      updateShowInfoMsg: channelsHandlers.epics.updateShowInfoMsg,
      unmute: () =>
        notificationCenterHandlers.epics.setChannelsNotification(
          notificationFilterType.ALL_MESSAGES
        )
    },
    dispatch
  )
export default connect(mapStateToProps, mapDispatchToProps)(ChannelHeader)
