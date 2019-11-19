import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import Tor from '../../components/windows/Tor'
import torSelectors from '../../store/selectors/tor'
import torHandlers from '../../store/handlers/tor'

export const mapStateToProps = state => ({
  tor: torSelectors.tor(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setEnabled: torHandlers.actions.setEnabled,
      setUrl: torHandlers.actions.setUrl,
      checkTor: torHandlers.epics.checkTor,
      createZcashNode: torHandlers.epics.createZcashNode
    },
    dispatch
  )
export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  React.memo,
  withRouter
)(Tor)
