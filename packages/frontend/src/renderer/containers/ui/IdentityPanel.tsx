import React from 'react'
import { useSelector } from 'react-redux'

import IdentityPanelComponent from '../../components/ui/IdentityPanel/IdentityPanel'
import { communities } from '@quiet/nectar'
import { useModal } from '../hooks'
import { ModalName } from '../../sagas/modals/modals.types'

export const useIdentityPanelData = () => {
  const data = {
    community: useSelector(communities.selectors.currentCommunity)
  }
  return data
}

const IdentityPanel = () => {
  const { community } = useIdentityPanelData()
  const modal = useModal(ModalName.accountSettingsModal)
  return <IdentityPanelComponent community={community} handleSettings={modal.handleOpen} />
}

export default IdentityPanel
