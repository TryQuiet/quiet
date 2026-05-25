import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@quiet/state-manager'
import TermsOfServiceComponent from './TermsOfServiceComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { createLogger } from '../../logger'
import { shell } from 'electron'

const logger = createLogger('TermsOfService')

const TermsOfService = () => {
  const dispatch = useDispatch()

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const tosRequested = useSelector(communities.selectors.tosRequested)

  const termsOfServiceModal = useModal(ModalName.termsOfServiceModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)

  useEffect(() => {
    if (tosRequested) {
      logger.info('ToS requested by state-manager, opening ToS modal')
      termsOfServiceModal.handleOpen()
    }
  }, [tosRequested])

  const handleChoice = async (accepted: boolean) => {
    if (accepted) {
      if (!currentCommunity) {
        loadingPanelModal.handleOpen()
      }
    } else {
      logger.info('User declined ToS, aborting join process')
      joinCommunityModal.handleOpen()
      loadingPanelModal.handleClose()
    }

    dispatch(
      communities.actions.setTermsOfServiceAccepted({
        communityId: currentCommunity?.id,
        accepted,
      })
    )

    termsOfServiceModal.handleClose()
  }

  const openURL = () => {
    shell.openExternal('https://github.com/TryQuiet/quiet/wiki/Privacy-Policy')
  }

  return (
    <TermsOfServiceComponent
      {...termsOfServiceModal}
      handleClose={() => handleChoice(false)}
      onChoose={handleChoice}
      openURL={openURL}
    />
  )
}

export default TermsOfService
