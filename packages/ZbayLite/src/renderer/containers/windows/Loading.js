import React from 'react'
import { connect } from 'react-redux'

import LoadingComponent from '../../components/windows/Loading'
import SyncLoader from '../../containers/windows/SyncLoader'
import identitySelectors from '../../store/selectors/identity'

export const mapStateToProps = state => ({
  loader: identitySelectors.loader(state)
})

export const Loading = ({ loader }) => {
  return loader.get('loading') ? (
    <LoadingComponent message={loader.get('message')} />
  ) : (
    <SyncLoader />
  )
}

export default connect(mapStateToProps)(Loading)
