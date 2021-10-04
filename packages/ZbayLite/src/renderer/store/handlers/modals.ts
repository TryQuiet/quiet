import { produce, immerable } from 'immer'
import { bindActionCreators } from 'redux'
import { connect, useDispatch, useSelector } from 'react-redux'
import { createAction, handleActions } from 'redux-actions'
import { actionTypes } from '../../../shared/static'

import { ActionsCreatorsTypes, PayloadType } from './types'

import modalsSelectors from '../selectors/modals'

export enum ModalName {
  createChannel = 'createChannel',
  accountSettingsModal = 'accountSettingsModal',
  openexternallink = 'openexternallink',
  seedModal = 'seedModal',
  criticalError = 'criticalError',
  createUsernameModal = 'createUsernameModal',
  channelInfo='channelInfo',
  channelSettingsModal='channelSettingsModal',
  publishChannel='publishChannel',
  joinChannel='joinChannel',
  newMessageSeparate='newMessageSeparate',
  quitApp='quitApp'
}

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

const openModal = (modalName: ModalName) => createAction(actionTypes.OPEN_MODAL, () => modalName)

const closeModal = (modalName: ModalName) => createAction(actionTypes.CLOSE_MODAL, () => modalName)

export const closeModalHandler = createAction<string>(actionTypes.CLOSE_MODAL)
export const openModalHandler = createAction<string>(actionTypes.OPEN_MODAL)

export const actionCreators = {
  openModal,
  closeModal
}

export type ModalsActions = ActionsCreatorsTypes<typeof actionCreators>

export const reducer = handleActions<Modals, PayloadType<ModalsActions>>(
  {
    [actionTypes.OPEN_MODAL]: (state, { payload }: ModalsActions['openModal']) =>
      produce(state, draft => {
        console.log('openModal', payload)
        draft[payload] = true
      }),
    [actionTypes.CLOSE_MODAL]: (state, { payload: modalName }: ModalsActions['closeModal']) =>
      produce(state, draft => {
        console.log('close modal')
        draft[modalName] = false
      })
  },
  initialState
)

export const withModal = (name: ModalName) => Component => {
  const mapStateToProps = state => ({
    open: modalsSelectors.open(name)(state)
  })

  const mapDispatchToProps = dispatch =>
    bindActionCreators(
      {
        handleOpen: openModal(name),
        handleClose: closeModal(name)
      },
      dispatch
    )
  const wrappedDisplayName = Component.displayName || Component.name || 'Component'
  const C = connect(mapStateToProps, mapDispatchToProps)(Component)
  C.displayName = `withModal(${wrappedDisplayName})`
  return C
}

export const useModal = (name: ModalName) => {
  const open = useSelector(modalsSelectors.open(name))
  const dispatch = useDispatch()
  const { handleOpen, handleClose } = bindActionCreators(
    {
      handleOpen: openModal(name),
      handleClose: closeModal(name)
    },
    dispatch
  )
  return {
    open,
    handleOpen,
    handleClose
  }
}

export default {
  reducer,
  actionCreators,
  withModal,
  closeModalHandler,
  openModalHandler
}
