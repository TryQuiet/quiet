import React from 'react'
import { useSelector } from 'react-redux'

import IdentityPanelComponent from '../../components/ui/IdentityPanel/IdentityPanel'
import { identity } from '@zbayapp/nectar'
import { useModal, ModalName } from '../../store/handlers/modals'

export const useIdentityPanelData = () => {
  const data = {
    identity: useSelector(identity.selectors.currentIdentity)
  }
  return data
}

const IdentityPanel = () => {
  const { identity } = useIdentityPanelData()
  const modal = useModal(ModalName.accountSettingsModal)

  return <IdentityPanelComponent identity={identity} handleSettings={modal.handleOpen} />
}

export default IdentityPanel
