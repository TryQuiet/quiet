import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import whitelistSelector from '../../../store/selectors/whitelist'
import whitelistHandlers from '../../../store/handlers/whitelist'
import SecurityComponent from '../../../components/widgets/settings/Security'

export const mapStateToProps = state => ({
  allowAll: whitelistSelector.allowAll(state),
  whitelisted: whitelistSelector.whitelisted(state),
  autoload: whitelistSelector.autoload(state)
})

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      toggleAllowAll: whitelistHandlers.epics.setWhitelistAll,
      removeImageHost: whitelistHandlers.epics.removeImageHost,
      removeSiteHost: whitelistHandlers.epics.removeSiteHost
    },
    dispatch
  )

export const Security = props => {
  return <SecurityComponent {...props} />
}

export default R.compose(connect(mapStateToProps, mapDispatchToProps))(Security)
