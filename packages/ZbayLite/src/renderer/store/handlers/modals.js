import Immutable from 'immutable'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { createAction, handleActions } from 'redux-actions'

import modalsSelectors from '../selectors/modals'

export const initialState = Immutable.Map()

const actionTypes = {
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL'
}

const openModal = (modalName) => createAction(actionTypes.OPEN_MODAL, () => modalName)
const closeModal = (modalName) => createAction(actionTypes.CLOSE_MODAL, () => modalName)

export const actionCreators = {
  openModal,
  closeModal
}

export const reducer = handleActions({
  [actionTypes.OPEN_MODAL]: (state, { payload: modalName }) => state.set(modalName, true),
  [actionTypes.CLOSE_MODAL]: (state, { payload: modalName }) => state.set(modalName, false)
}, initialState)

export const withModal = (name) => (Component) => {
  const mapStateToProps = state => ({
    open: modalsSelectors.open(name)(state)
  })

  const mapDispatchToProps = dispatch => bindActionCreators({
    handleOpen: openModal(name),
    handleClose: closeModal(name)
  }, dispatch)
  const wrappedDisplayName = Component.displayName || Component.name || 'Component'
  const C = connect(mapStateToProps, mapDispatchToProps)(Component)
  C.displayName = `withModal(${wrappedDisplayName})`
  return C
}

export default {
  reducer,
  actionCreators,
  withModal
}
