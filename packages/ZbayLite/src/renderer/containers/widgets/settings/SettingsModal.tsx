import { communities } from '@zbayapp/nectar'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SettingsModal from '../../../components/widgets/settings/SettingsModal'
import { ModalName } from '../../../sagas/modals/modals.types'
import { actions } from '../../../store/handlers/app'
import appSelectors from '../../../store/selectors/app'
import { useModal } from '../../hooks'

const useSettingsModalData = () => {
  const data = {
    modalTabToOpen: useSelector(appSelectors.currentModalTab),
    user: 'settingsModalUser',
    isOwner: useSelector(communities.selectors.isOwner),
    blockedUsers: []
  }
  return data
}
const useSettingsModalActions = () => {
  const dispatch = useDispatch()
  const clearCurrentOpenTab = () => dispatch(actions.clearModalTab)
  return { clearCurrentOpenTab }
}

const SettingsModalContainer = () => {
  const [currentTab, setCurrentTab] = useState('account')
  const { modalTabToOpen, user, isOwner, blockedUsers } = useSettingsModalData()
  const { clearCurrentOpenTab } = useSettingsModalActions()
  const modal = useModal(ModalName.accountSettingsModal)

  return (
    <SettingsModal
      setCurrentTab={setCurrentTab}
      currentTab={currentTab}
      blockedUsers={blockedUsers}
      user={user}
      isOwner={isOwner}
      modalTabToOpen={modalTabToOpen}
      handleClose={modal.handleClose}
      open={modal.open}
      clearCurrentOpenTab={clearCurrentOpenTab}
    />
  )
}

export default SettingsModalContainer
