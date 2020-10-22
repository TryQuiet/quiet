import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import whitelistSelector from '../../../store/selectors/whitelist'
import appSelectors from '../../../store/selectors/app'
import whitelistHandlers from '../../../store/handlers/whitelist'
import SecurityComponent from '../../../components/widgets/settings/Security'
import modalsHandlers from '../../../store/handlers/modals'
import usersHandlers from '../../../store/handlers/users'
import appHandlers from '../../../store/handlers/app'
import electronStore from '../../../../shared/electronStore'

export const mapStateToProps = state => ({
  allowAll: whitelistSelector.allowAll(state),
  whitelisted: whitelistSelector.whitelisted(state),
  autoload: whitelistSelector.autoload(state),
  useTor: appSelectors.useTor(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      toggleAllowAll: whitelistHandlers.epics.setWhitelistAll,
      removeImageHost: whitelistHandlers.epics.removeImageHost,
      removeSiteHost: whitelistHandlers.epics.removeSiteHost,
      onRescan: appHandlers.epics.restartAndRescan,
      openSeedModal: modalsHandlers.actionCreators.openModal('seedModal'),
      registerOnionAddress: useTor =>
        usersHandlers.epics.registerOnionAddress(useTor)
    },
    dispatch
  )

export const Security = props => {
  const channelsToRescan = electronStore.get('channelsToRescan')
  const isNodeRescanned = electronStore.get('isRescanned')
  const isRescanned = isNodeRescanned === true && R.isEmpty(channelsToRescan)
  return <SecurityComponent isRescanned={isRescanned} {...props} />
}

export default R.compose(connect(mapStateToProps, mapDispatchToProps))(Security)
