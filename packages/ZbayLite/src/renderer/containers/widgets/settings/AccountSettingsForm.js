import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import usersHandlers from '../../../store/handlers/users'
import modalsHandlers from '../../../store/handlers/modals'
import AccountSettingsForm from '../../../components/widgets/settings/AccountSettingsForm'
import identitySelectors from '../../../store/selectors/identity'
import usersSelector from '../../../store/selectors/users'

export const mapStateToProps = state => {
  return {
    transparentAddress: identitySelectors.transparentAddress(state),
    privateAddress: identitySelectors.address(state),
    user: usersSelector.registeredUser(identitySelectors.signerPubKey(state))(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      openModal: modalsHandlers.actionCreators.openModal('createUsernameModal'),
      closeModal: modalsHandlers.actionCreators.closeModal('accountSettingsModal'),
      handleSubmit: ({ nickname }) => usersHandlers.epics.createOrUpdateUser({ nickname })
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountSettingsForm)
