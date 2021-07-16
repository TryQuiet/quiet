import * as R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import usersHandlers from '../../../store/handlers/users'
import identitySelectors from '../../../store/selectors/identity'
import usersSelectors from '../../../store/selectors/users'
// import feesSelectors from '../../../store/selectors/fees'
// import ratesSelectors from '../../../store/selectors/rates'
import certificatesSelector from '../../../store/certificates/certificates.selector'

import CreateUsernameModal from '../../../components/widgets/createUsername/CreateUsernameModal'
import { withModal } from '../../../store/handlers/modals'
export const mapStateToProps = state => {
  return {
    initialValues: {
      nickname: usersSelectors.registeredUser(
        identitySelectors.signerPubKey(state)
      )(state)
        ? usersSelectors
          .registeredUser(identitySelectors.signerPubKey(state))(state)
          .nickname
        : '',
      takenUsernames: identitySelectors.registrationStatus(state)
    },
    // usernameFee: feesSelectors.userFee(state),
    // zecRate: ratesSelectors.rate('usd')(state),
    enoughMoney: true,
    certificateRegistrationError: certificatesSelector.certificateRegistrationError(state),
    certificate: certificatesSelector.ownCertificate(state)
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      handleSubmit: ({ nickname }) => {
        return usersHandlers.epics.createOrUpdateUser({ nickname, debounce: true })
      }
    },
    dispatch
  )

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('createUsernameModal')
)(CreateUsernameModal)
