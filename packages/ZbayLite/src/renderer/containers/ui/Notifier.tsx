import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Notifier from '../../components/ui/Notifier'
import notificationsHandlers from '../../store/handlers/notifications'
import notificationsSelectors from '../../store/selectors/notifications'

export const mapStateToProps = state => ({
  notifications: notificationsSelectors.data(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  removeSnackbar: notificationsHandlers.actions.removeSnackbar
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Notifier)
