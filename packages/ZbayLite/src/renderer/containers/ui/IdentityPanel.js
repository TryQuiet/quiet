import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import IdentityPanel from '../../components/ui/IdentityPanel'
import identitySelectors from '../../store/selectors/identity'
import usersSelectors from '../../store/selectors/users'
import { actionCreators } from '../../store/handlers/modals'

export const mapStateToProps = state => {
  const identity = identitySelectors.data(state)
  return {
    identity: identity,
    user: usersSelectors.registeredUser(identity.signerPubKey)(state)
  }
}

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      handleSettings: actionCreators.openModal('accountSettingsModal'),
      handleInvitation: actionCreators.openModal('invitationModal')
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(IdentityPanel)
