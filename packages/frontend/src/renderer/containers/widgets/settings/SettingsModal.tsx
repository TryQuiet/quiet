import React from 'react'
import { useSelector } from 'react-redux'
import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import { communities, identity } from '@quiet/nectar'

const SettingsModalContainer = () => {
  const modal = useModal(ModalName.accountSettingsModal)

  const owner = useSelector(communities.selectors.isOwner)

  return <SettingsModal title={'Settings'} owner={owner} {...modal} />
}

export default SettingsModalContainer
