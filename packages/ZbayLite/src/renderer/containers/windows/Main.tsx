import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import MainComponent from '../../components/windows/Main'
import modalsHandlers from '../../store/handlers/modals'
import electronStore from '../../../shared/electronStore'

export const mapStateToProps = _state => ({
})
export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      openSettingsModal: modalsHandlers.actionCreators.openModal(
        'createUsernameModal'
      )
    },
    dispatch
  )
}

export const Main = ({
  zecBalance,
  openSettingsModal,
  fetchBalance,
  ...props
}) => {
  useEffect(() => {
    const isNewUser = electronStore.get('isNewUser')
    if (isNewUser === true) {
      openSettingsModal()
    }
  }, [])
  return <MainComponent {...props} />
}

export default R.compose(
  React.memo,
  connect(mapStateToProps, mapDispatchToProps)
)(Main)
