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

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  useEffect(() => {
    if (currentCommunity && !currentIdentity?.userId && !createUsernameModal.open) {
      logger.info('Open create username modal')
      createUsernameModal.handleOpen()
    }
    if (currentIdentity?.userId && createUsernameModal.open) {
      logger.info('Close create username modal')
      createUsernameModal.handleClose()
    }
  }, [currentIdentity, currentCommunity])

  const registerUsername = (nickname: string) => {
    logger.info('Register username', nickname)
    dispatch(
      identity.actions.registerUsername({
        nickname,
      })
    )
    logger.info('Set loading panel type', LoadingPanelType.Joining)
    dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    logger.info('Open loading panel')
    loadingPanelModal.handleOpen()
  }

  return <CreateUsernameComponent {...createUsernameModal} registerUsername={registerUsername} />
}

export default CreateUsername
