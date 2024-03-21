import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingPanelType } from '@quiet/types'
import { communities, identity, network } from '@quiet/state-manager'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'

const CreateUsername = () => {
  const dispatch = useDispatch()

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  useEffect(() => {
    if (currentCommunity && !currentIdentity?.userCsr && !createUsernameModal.open) {
      createUsernameModal.handleOpen()
    }
    if (currentIdentity?.userCsr && createUsernameModal.open) {
      createUsernameModal.handleClose()
    }
  }, [currentIdentity, currentCommunity])

  const registerUsername = (nickname: string) => {
    dispatch(identity.actions.registerUsername({ nickname }))
    dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    loadingPanelModal.handleOpen()
  }

  return <CreateUsernameComponent {...createUsernameModal} registerUsername={registerUsername} />
}

export default CreateUsername
