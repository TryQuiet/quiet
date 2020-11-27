import { produce, immerable } from 'immer'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

import { ActionsCreatorsTypes, PayloadType } from './types'

import modalsSelectors from '../selectors/modals'

class Modals {
  payloads: {}

  constructor(values?: Partial<Modals>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: Modals = new Modals({
  payloads: {}
})

const openModal = (modalName: string, data?: any) => createAction(actionTypes.OPEN_MODAL, () => ({
  modalName,
  data
}))

const closeModal = (modalName: string) => createAction(actionTypes.CLOSE_MODAL, () => modalName)

export const actionCreators = {
  openModal,
  closeModal
}

export type ModalsActions = ActionsCreatorsTypes<typeof actionCreators>

export const reducer = handleActions<Modals, PayloadType<ModalsActions>>(
  {
    [actionTypes.OPEN_MODAL]: (state, { payload }: ModalsActions['openModal']) =>
      produce(state, draft => {
        draft[payload.modalName] = true
        draft.payloads = {
          ...draft.payloads,
          [payload.modalName]: payload.data
        }
      }),
    [actionTypes.CLOSE_MODAL]: (state, { payload: modalName }: ModalsActions['closeModal']) =>
      produce(state, draft => {
        draft[modalName] = false
      })
  },
  initialState
)

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
