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
  const termsOfServiceModal = useModal(ModalName.termsOfServiceModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const registerUsername = (nickname: string) => {
    logger.info('Register username', nickname)
    dispatch(
      identity.actions.registerUsername({
        nickname,
      })
    )
    logger.info('Set loading panel type', LoadingPanelType.Joining)
    dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    if (process.env.QSS_ALLOWED === 'true') {
      logger.info('Open terms of service modal')
      termsOfServiceModal.handleOpen()
    } else {
      logger.info('Open loading panel')
      loadingPanelModal.handleOpen()
    }
    createUsernameModal.handleClose()
  }

  return <CreateUsernameComponent {...createUsernameModal} registerUsername={registerUsername} />
}

export default CreateUsername
