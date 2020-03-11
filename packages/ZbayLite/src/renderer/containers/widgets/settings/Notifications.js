import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import notificationCenterSelector from '../../../store/selectors/notificationCenter'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import Notifications from '../../../components/widgets/settings/Notifications'

export const mapStateToProps = state => ({
  userFilterType: notificationCenterSelector.userFilterType(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setUserNotification: notificationCenterHandlers.epics.setUserNotification
    },
    dispatch
  )

export default R.compose(connect(mapStateToProps, mapDispatchToProps))(
  Notifications
)
