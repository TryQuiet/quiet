import * as R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import usersHandlers from '../../../store/handlers/users'
import identitySelectors from '../../../store/selectors/identity'
import usersSelectors from '../../../store/selectors/users'

import CreateUsernameModal from '../../../components/widgets/createUsername/CreateUsernameModal'
import { withModal } from '../../../store/handlers/modals'

export const mapStateToProps = state => {
  return {
    initialValues: {
      nickname: usersSelectors.registeredUser(identitySelectors.signerPubKey(state))(state)
        ? usersSelectors
          .registeredUser(identitySelectors.signerPubKey(state))(state)
          .get('nickname')
        : ''
    }
  }
}

export const mapDispatchToProps = dispatch => bindActionCreators({
  checkNickname: usersHandlers.epics.isNicknameTaken,
  handleSubmit: ({ nickname }) => usersHandlers.epics.createOrUpdateUser({ nickname })
}, dispatch)

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('createUsernameModal')
)(CreateUsernameModal)
