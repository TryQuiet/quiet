import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import usersHandlers from '../../../store/handlers/users'
import AccountSettingsForm from '../../../components/widgets/settings/AccountSettingsForm'
import identitySelectors from '../../../store/selectors/identity'
import usersSelectors from '../../../store/selectors/users'

export const mapStateToProps = state => {
  return {
    initialValues: {
      nickname: usersSelectors.registeredUser(identitySelectors.signerPubKey(state))(state)
        ? usersSelectors
          .registeredUser(identitySelectors.signerPubKey(state))(state)
          .get('nickname')
        : null
    },
    transparentAddress: identitySelectors.transparentAddress(state),
    privateAddress: identitySelectors.address(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      checkNickname: usersHandlers.epics.isNicknameTaken,
      handleSubmit: ({ nickname }) => usersHandlers.epics.createOrUpdateUser({ nickname })
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountSettingsForm)
