import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'
import contactsSelectors from '../../../store/selectors/contacts'
// import usersSelectors from '../../../store/selectors/users'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import notificationCenterSlectors from '../../../store/selectors/notificationCenter'
import { notificationFilterType } from '../../../../shared/static'

export const mapStateToProps = (state, props) => {
  const contact = contactsSelectors.contact(props.contactId)(state)
  return {
    channel: {
      name: contact.username,
      address: props.contactId,
      displayableMessageLimit: 50
    },
    isRegisteredUsername: true,
    // isRegisteredUsername: usersSelectors.isRegisteredUsername(contact.username)(state),
    directMessage: true,
    mutedFlag:
      notificationCenterSlectors.contactFilterByAddress(contact.address)(
        state
      ) === notificationFilterType.MUTE
  }
}
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      unmute: () =>
        notificationCenterHandlers.epics.setContactNotification(
          notificationFilterType.ALL_MESSAGES
        )
    },
    dispatch
  )
export default connect(mapStateToProps, mapDispatchToProps)(ChannelHeader)
