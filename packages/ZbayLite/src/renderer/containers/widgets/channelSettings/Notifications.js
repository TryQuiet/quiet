import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import notificationCenterActions from '../../../store/handlers/notificationCenter'
import Notifications from '../../../components/widgets/channelSettings/Notifications'
import notificationCenterSelectors from '../../../store/selectors/notificationCenter'
import channelSelectors from '../../../store/selectors/channel'
import appHandlers from '../../../store/handlers/app'
import { actionCreators } from '../../../store/handlers/modals'

export const mapStateToProps = state => {
  return {
    currentFilter: notificationCenterSelectors.channelFilterById(
      channelSelectors.data(state).get('address')
    )(state),
    channelData: channelSelectors.data(state).toJS()
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
