import React from 'react'
import { connect } from 'react-redux'

import SyncLoader from '../../containers/windows/SyncLoader'
import modalsSelectos from '../../store/selectors/modals'
import TopUpModal from '../../containers/ui/TopUpModal'
import electronStore from '../../../shared/electronStore'

export const mapStateToProps = state => ({
  openedModal: modalsSelectos.open('topUp')(state)
})

export const Loading = ({ newUser, openedModal, done }) => {
  const isNewUser = electronStore.get('isNewUser')
  return !openedModal ? <SyncLoader newUser={isNewUser} /> : <TopUpModal />
}

export default connect(
  mapStateToProps
)(Loading)
