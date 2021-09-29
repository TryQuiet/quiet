
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import notificationCenterActions from '../../../store/handlers/notificationCenter'
import Notifications from '../../../components/widgets/channelSettings/Notifications'
import notificationCenterSelectors from '../../../store/selectors/notificationCenter'
import channelSelectors from '../../../store/selectors/channel'
import appHandlers from '../../../store/handlers/app'
import contactsSelectors from '../../../store/selectors/contacts'
import { actionCreators, ModalName } from '../../../store/handlers/modals'

export const mapStateToProps = state => {
  return {
    currentFilter: notificationCenterSelectors.channelFilterById(
      channelSelectors.channel(state).address
    )(state),
    channelData: contactsSelectors.contact(channelSelectors.channel(state).address)(state)
  }
}

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      setChannelsNotification:
        notificationCenterActions.epics.setChannelsNotification,
      openNotificationsTab: () => appHandlers.actions.setModalTab('notifications'),
      openSettingsModal: actionCreators.openModal(ModalName.accountSettingsModal)
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(Notifications)
