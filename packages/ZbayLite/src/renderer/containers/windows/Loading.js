import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import LoadingComponent from '../../components/windows/Loading'
import SyncLoader from '../../containers/windows/SyncLoader'
import AddFunds from '../../containers/windows/AddFunds'
import identitySelectors from '../../store/selectors/identity'
import appSelectos from '../../store/selectors/app'
import vaultHanlders from '../../store/handlers/vault'

export const mapStateToProps = state => ({
  loader: identitySelectors.loader(state),
  newUser: appSelectos.newUser(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setVaultIdentity: vaultHanlders.epics.setVaultIdentity
    },
    dispatch
  )

export const Loading = ({ loader, newUser, setVaultIdentity }) => {
  useEffect(() => {
    setVaultIdentity()
  }, [])
  return loader.get('loading') ? (
    <LoadingComponent message={loader.get('message')} />
  ) : newUser === false ? (
    <SyncLoader />
  ) : (
    <AddFunds />
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Loading)
