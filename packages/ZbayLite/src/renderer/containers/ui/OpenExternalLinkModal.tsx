import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { shell } from 'electron'

import OpenlinkModalComponent from '../../components/ui/OpenlinkModal/OpenlinkModal'
import whitelistHandlers from '../../store/handlers/whitelist'
import { ModalName, useModal } from '../../store/handlers/modals'
import modalsSelectors from '../../store/selectors/modals'

export interface useOpenExternalLinkModalDataReturnTypes {
  payload: string
}

export interface useOpenExternalLinkModalActionsReturnTypes {
  addToWhitelist: (url: string) => void
  setWhitelistAll: () => void
}

export const useOpenExternalLinkModalData = (): useOpenExternalLinkModalDataReturnTypes => {
  const data = {
    payload: useSelector(modalsSelectors.payload('openexternallink'))
  }
  return data
}

export const useOpenExternalLinkModalActions = (): useOpenExternalLinkModalActionsReturnTypes => {
  const dispatch = useDispatch()
  const addToWhitelist = (url: string) =>
    dispatch(whitelistHandlers.epics.addToWhitelist(url, true))
  const setWhitelistAll = () => dispatch(whitelistHandlers.epics.setWhitelistAll(true))
  return { addToWhitelist, setWhitelistAll }
}

const OpenLinkModal = ({ ...rest }) => {
  const { payload } = useOpenExternalLinkModalData()
  const modal = useModal(ModalName.openexternallink)
  const { setWhitelistAll, addToWhitelist } = useOpenExternalLinkModalActions()

  return (
    <OpenlinkModalComponent
      handleConfirm={async () => {
        await shell.openExternal(payload)
      }}
      url={payload}
      open={modal.open}
      handleClose={modal.handleClose}
      addToWhitelist={addToWhitelist}
      setWhitelistAll={setWhitelistAll}
      {...rest}
    />
  )
}

export default OpenLinkModal
