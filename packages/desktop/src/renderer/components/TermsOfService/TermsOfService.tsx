import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@quiet/state-manager'
import TermsOfServiceComponent from './TermsOfServiceComponent'
import { ModalName } from '../../sagas/modals/modals.types'
import { useModal } from '../../containers/hooks'
import { createLogger } from '../../logger'
import { openExternal } from '../../openExternal'

const logger = createLogger('TermsOfService')

/** The host the copy names ("api.tryquiet.org"): the QSS endpoint without scheme and path. */
export const serverHost = (endpoint?: string): string | undefined => {
  const host = endpoint?.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/[/?#].*$/, '')
  return host || undefined
}

const TermsOfService = () => {
  const dispatch = useDispatch()

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const tosRequested = useSelector(communities.selectors.tosRequested)

  // The invite carries the server (v5); once the community exists it is on the community.
  const qssEndPoint = serverHost(
    (invitationCodes && 'qssEndpoint' in invitationCodes ? invitationCodes.qssEndpoint : undefined) ??
      currentCommunity?.qssEndpoint
  )

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
    openExternal('https://github.com/TryQuiet/quiet/wiki/Privacy-Policy')
  }

  return (
    <TermsOfServiceComponent
      open={termsOfServiceModal.open}
      handleClose={() => handleChoice(false)}
      onAgree={() => handleChoice(true)}
      openURL={openURL}
      qssEndPoint={qssEndPoint}
    />
  )
}

export default TermsOfService
