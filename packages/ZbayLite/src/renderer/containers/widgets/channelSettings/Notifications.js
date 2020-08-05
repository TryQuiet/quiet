import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import notificationCenterActions from '../../../store/handlers/notificationCenter'
import Notifications from '../../../components/widgets/channelSettings/Notifications'
import notificationCenterSelectors from '../../../store/selectors/notificationCenter'
import channelSelectors from '../../../store/selectors/channel'
import appHandlers from '../../../store/handlers/app'
import contactsSelectors from '../../../store/selectors/contacts'
import { actionCreators } from '../../../store/handlers/modals'

export const mapStateToProps = state => {
  return {
    currentFilter: notificationCenterSelectors.channelFilterById(
      channelSelectors.channel(state).get('address')
    )(state),
    channelData: contactsSelectors.contact(channelSelectors.channel(state).get('address'))(state).toJS()
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      setChannelsNotification:
        notificationCenterActions.epics.setChannelsNotification,
      openNotificationsTab: () => appHandlers.actions.setModalTab('notifications'),
      openSettingsModal: actionCreators.openModal('accountSettingsModal')
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(Notifications)
