import React from 'react'
import { connect } from 'react-redux'

import LoadingComponent from '../../components/windows/Loading'
import SyncLoader from '../../containers/windows/SyncLoader'
import AddFunds from '../../containers/windows/AddFunds'
import identitySelectors from '../../store/selectors/identity'
import appSelectos from '../../store/selectors/app'

export const mapStateToProps = state => ({
  loader: identitySelectors.loader(state),
  newUser: appSelectos.newUser(state)
})

export const Loading = ({ loader, newUser }) => {
  return loader.get('loading') ? (
    <LoadingComponent message={loader.get('message')} />
  ) : newUser === false ? (
    <SyncLoader />
  ) : (
    <AddFunds />
  )
}

export default connect(mapStateToProps)(Loading)
