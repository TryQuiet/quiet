import React from 'react'

import { connect } from 'react-redux'
import * as R from 'ramda'
import { shell } from 'electron'
import { bindActionCreators } from 'redux'

import OpenlinkModalComponent from '../../components/ui/OpenlinkModal'
import whitelistHandlers from '../../store/handlers/whitelist'

import { withModal } from '../../store/handlers/modals'
import modalsSelectors from '../../store/selectors/modals'

export const mapStateToProps = state => ({
  payload: modalsSelectors.payload('openexternallink')(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      addToWhitelist: whitelistHandlers.epics.addToWhitelist,
      setWhitelistAll: whitelistHandlers.epics.setWhitelistAll
    },
    dispatch
  )

const OpenlinkModal = ({ payload, ...rest }) => (
  <OpenlinkModalComponent
    handleConfirm={() => {
      shell.openExternal(payload)
    }}
    url={payload}
    {...rest}
  />
)

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('openexternallink')
)(OpenlinkModal)
