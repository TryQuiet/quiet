import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import TorComponent from '../../components/windows/Tor'
import torSelectors from '../../store/selectors/tor'
import torHandlers, { store } from '../../store/handlers/tor'

export const mapStateToProps = state => ({
  tor: torSelectors.tor(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setEnabled: torHandlers.actions.setEnabled,
      setUrl: torHandlers.actions.setUrl,
      checkTor: torHandlers.epics.checkTor,

      checkDeafult: torHandlers.epics.checkDeafult
    },
    dispatch
  )

const Tor = ({ ...props }) => {
  useEffect(() => {
    if (store.get('torEnabled')) {
      props.setEnabled({ enabled: true })
      props.checkDeafult()
    }
  }, [])
  return <TorComponent {...props} />
}
export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withRouter,
  React.memo
)(Tor)
