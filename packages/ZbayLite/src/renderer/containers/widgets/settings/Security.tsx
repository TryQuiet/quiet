import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import SecurityComponent from '../../../components/widgets/settings/Security'
import modalsHandlers from '../../../store/handlers/modals'
import electronStore from '../../../../shared/electronStore'
import whitelistSelector from '../../../store/selectors/whitelist'
import whitelistHandlers from '../../../store/handlers/whitelist'

export const mapStateToProps = state => ({
  allowAll: whitelistSelector.allowAll(state),
  whitelisted: whitelistSelector.whitelisted(state),
  autoload: whitelistSelector.autoload(state)
  // useTor: appSelectors.useTor(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      toggleAllowAll: whitelistHandlers.epics.setWhitelistAll,
      removeImageHost: whitelistHandlers.epics.removeImageHost,
      removeSiteHost: whitelistHandlers.epics.removeSiteHost,
      // onRescan: appHandlers.epics.restartAndRescan,
      openSeedModal: modalsHandlers.actionCreators.openModal('seedModal')
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
