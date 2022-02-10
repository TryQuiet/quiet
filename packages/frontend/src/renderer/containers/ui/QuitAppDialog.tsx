import React from 'react'

import { useModal } from '../hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import QuitAppDialog from '../../components/ui/QuitApp/QuitAppDialog'
import remote from '@electron/remote'

export interface IQuitAppDialogActionsReturnTypes {
  handleQuit: () => void
}

const useQuitAppDialogActions = (): IQuitAppDialogActionsReturnTypes => {
  const handleQuit = () => {
    remote.app.relaunch()
    remote.app.quit()
  }
  return { handleQuit }
}

const QuitAppDialogContainer = () => {
  const modal = useModal(ModalName.quitApp)

  const { handleQuit } = useQuitAppDialogActions()

  return <QuitAppDialog handleClose={modal.handleClose} open={modal.open} handleQuit={handleQuit} />
}

export default QuitAppDialogContainer
