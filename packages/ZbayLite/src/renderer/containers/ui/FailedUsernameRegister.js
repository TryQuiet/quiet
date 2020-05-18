import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import FailedUsernameRegister from '../../components/ui/FailedUsernameRegister'
import modalsHandlers, { withModal } from '../../store/handlers/modals'

export const mapStateToProps = state => ({})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      openModalCreateUsername: modalsHandlers.actionCreators.openModal('createUsernameModal')
    },

    dispatch
  )

export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps),
  withModal('failedUsernameRegister')
)(FailedUsernameRegister)
