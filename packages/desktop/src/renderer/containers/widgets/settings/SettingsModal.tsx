import React from 'react'
import { useSelector } from 'react-redux'
import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { communities } from '@quiet/state-manager'

const SettingsModalContainer = () => {
  const modal = useModal(ModalName.accountSettingsModal)
  const community = useSelector(communities.selectors.currentCommunity)
  const isOwner = Boolean(community?.CA)

  return <SettingsModal title={'Settings'} isOwner={isOwner} {...modal} />
}

export default SettingsModalContainer
