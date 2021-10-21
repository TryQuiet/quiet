import React from 'react'
import { useDispatch } from 'react-redux'
import { shell } from 'electron'

import OpenlinkModalComponent from '../../components/ui/OpenlinkModal/OpenlinkModal'
import whitelistHandlers from '../../store/handlers/whitelist'
import { useModal } from '../hooks'
import { ModalName } from '../../sagas/modals/modals.types'

export interface useOpenExternalLinkModalActionsReturnTypes {
  addToWhitelist: (url: string) => void
  setWhitelistAll: () => void
}

export const useOpenExternalLinkModalActions = (): useOpenExternalLinkModalActionsReturnTypes => {
  const dispatch = useDispatch()
  const addToWhitelist = (url: string) =>
    dispatch(whitelistHandlers.epics.addToWhitelist(url, true))
  const setWhitelistAll = () => dispatch(whitelistHandlers.epics.setWhitelistAll(true))
  return { addToWhitelist, setWhitelistAll }
}

const OpenLinkModal = ({ ...rest }) => {
  const modal = useModal(ModalName.openexternallink)
  const { setWhitelistAll, addToWhitelist } = useOpenExternalLinkModalActions()

  return (
    <OpenlinkModalComponent
      handleConfirm={async () => {
        await shell.openExternal(rest.url)
      }}
      url={rest.url}
      open={modal.open}
      handleClose={modal.handleClose}
      addToWhitelist={addToWhitelist}
      setWhitelistAll={setWhitelistAll}
      {...rest}
    />
  )
}

export default OpenLinkModal
