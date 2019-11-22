import React from 'react'
import { connect } from 'react-redux'

import SyncLoader from '../../containers/windows/SyncLoader'
import AddFunds from '../../containers/windows/AddFunds'
import appSelectos from '../../store/selectors/app'

export const mapStateToProps = state => ({
  newUser: appSelectos.newUser(state)
})

export const Loading = ({ newUser }) => {
  return newUser === false ? (
    <SyncLoader />
  ) : (
    <AddFunds />
  )
}

export default connect(
  mapStateToProps
)(Loading)
