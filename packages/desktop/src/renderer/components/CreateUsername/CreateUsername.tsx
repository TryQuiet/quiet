import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingPanelType } from '@quiet/types'
import { communities, identity, network } from '@quiet/state-manager'
import CreateUsernameComponent from '../CreateUsername/CreateUsernameComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { createLogger } from '../../logger'

const logger = createLogger('CreateUsername')

const CreateUsername = () => {
  const dispatch = useDispatch()

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)

  const registerUsername = (nickname: string) => {
    logger.info('Register username', nickname)
    dispatch(
      identity.actions.registerUsername({
        nickname,
      })
    )
    loadingPanelModal.handleOpen()
    createUsernameModal.handleClose()
  }

  const handleClose = () => {
    createUsernameModal.handleClose()
    joinCommunityModal.handleOpen()
  }

  return (
    <CreateUsernameComponent {...createUsernameModal} handleClose={handleClose} registerUsername={registerUsername} />
  )
}

export default CreateUsername
