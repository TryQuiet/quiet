import React from 'react'
import { connect } from 'react-redux'

import SyncLoader from '../../containers/windows/SyncLoader'
import appSelectos from '../../store/selectors/app'
import modalsSelectos from '../../store/selectors/modals'
import TopUpModal from '../../containers/ui/TopUpModal'

export const mapStateToProps = state => ({
  newUser: appSelectos.newUser(state),
  openedModal: modalsSelectos.open('topUp')(state)
})

export const Loading = ({ newUser, openedModal, done }) => {
  return !openedModal ? <SyncLoader newUser /> : <TopUpModal />
}

export default connect(
  mapStateToProps
)(Loading)
