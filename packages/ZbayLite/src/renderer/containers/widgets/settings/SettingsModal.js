import React, { useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { withModal } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import appSelectors from '../../../store/selectors/app'
import identitySelectors from '../../../store/selectors/identity'
import usersSelector from '../../../store/selectors/users'

const mapStateToProps = state => {
  const user = usersSelector.registeredUser(identitySelectors.signerPubKey(state))(state)
  return {
    modalTabToOpen: appSelectors.currentModalTab(state),
    user: user
      ? `@${user.nickname}`
      : `@anon${identitySelectors.signerPubKey(state).substring(0, 15)}`
  }
}

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      clearCurrentOpenTab: actions.clearModalTab
    },
    dispatch
  )

const SettingsModalContainer = props => {
  const [currentTab, setCurrentTab] = useState('account')
  return <SettingsModal {...props} setCurrentTab={setCurrentTab} currentTab={currentTab} />
}

export default R.compose(
  withModal('accountSettingsModal'),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(SettingsModalContainer)
