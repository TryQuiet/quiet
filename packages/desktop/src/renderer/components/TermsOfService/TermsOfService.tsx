import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@quiet/state-manager'
import TermsOfServiceComponent from './TermsOfServiceComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { createLogger } from '../../logger'
import { shell } from 'electron'
import { current } from 'immer'

const logger = createLogger('TermsOfService')

const TermsOfService = () => {
  const dispatch = useDispatch()

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const termsOfServiceModal = useModal(ModalName.termsOfServiceModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)

  useEffect(() => {
    if (
      currentCommunity &&
      !currentCommunity?.tosAccepted &&
      currentCommunity?.qssEnabled === true &&
      currentIdentity &&
      currentIdentity?.communityId == currentCommunity.id &&
      !termsOfServiceModal.open
    ) {
      logger.info('Open terms of service modal')
      termsOfServiceModal.handleOpen()
    }
    if (currentCommunity?.tosAccepted && termsOfServiceModal.open) {
      logger.info('Close terms of service modal')
      termsOfServiceModal.handleClose()
    }
  }, [currentCommunity])

  const handleChoice = (accepted: boolean) => {
    dispatch(
      communities.actions.setTermsOfServiceAccepted({
        communityId: currentCommunity?.id,
        accepted,
      })
    )
    if (accepted) {
      if (!currentCommunity) {
        loadingPanelModal.handleOpen()
      }
    } else {
      logger.info('User declined ToS, aborting join process')
      joinCommunityModal.handleOpen()
      loadingPanelModal.handleClose()
    }
    termsOfServiceModal.handleClose()
  }

  const openURL = () => {
    shell.openExternal('https://github.com/TryQuiet/quiet/wiki/Privacy-Policy-&-Terms-of-Use')
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
