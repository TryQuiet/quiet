import React from 'react'
import { useSelector } from 'react-redux'

import IdentityPanelComponent from '../../components/ui/IdentityPanel/IdentityPanel'
import { identity } from '@zbayapp/nectar'
import { useModal } from '../hooks'
import { ModalName } from '../../sagas/modals/modals.types'

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
