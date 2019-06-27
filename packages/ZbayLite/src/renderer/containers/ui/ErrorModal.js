import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import ErrorModal from '../../components/ui/ErrorModal'
import criticalErrorSelectors from '../../store/selectors/criticalError'
import modalsHandlers, { withModal } from '../../store/handlers/modals'

export const mapStateToProps = state => ({
  message: criticalErrorSelectors.message(state),
  traceback: criticalErrorSelectors.traceback(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  handleExit: modalsHandlers.actionCreators.openModal('quitApp')
}, dispatch)

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('criticalError')
)(ErrorModal)
