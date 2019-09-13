import React from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import LoadingComponent from '../../components/windows/Loading'
import identitySelectors from '../../store/selectors/identity'

export const mapStateToProps = state => ({
  loader: identitySelectors.loader(state)
})

export const Loading = ({ loader }) => {
  return loader.get('loading') ? (
    <LoadingComponent message={loader.get('message')} />
  ) : (
    <Redirect to='/main/channel/general' />
  )
}

export default connect(mapStateToProps)(Loading)
