import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { communities, connection } from '@quiet/state-manager'

import Modal from '../ui/Modal/Modal'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { GetStartedComponent } from './GetStartedComponent'
import { createLogger } from '../../logger'

const logger = createLogger('GetStarted')

/**
 * The onboarding entry point. Opens itself when the app is connected and has no
 * community, unless another onboarding modal is already showing.
 *
 * No bar title and no glyph: the window chrome already carries the app's name,
 * so the frame's "Quiet" bar text is left out (decided 2026-09-13) and there is
 * nothing to go back to from the entry. The 60 bar zone itself stays, as it does
 * on every other full-screen stage, so the content column starts at the same y
 * here as on the screens this one leads to — dropping the zone as well is what
 * made Get started → Join community jump 76px (`onboardingRhythm.ts`).
 */
export const GetStarted: React.FC = () => {
  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const admissionResetStatus = useSelector(communities.selectors.admissionResetStatus)
  // A join that failed belongs to the join flow, which reopens itself to report it.
  const joinCommunityError = useSelector(communities.selectors.joinCommunityError)
  const torBootstrapProcess = useSelector(connection.selectors.torBootstrapProcess)

  const getStartedModal = useModal(ModalName.getStartedModal)
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const linkDevicesModal = useModal(ModalName.linkDevicesModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  // The loading panel counts too: while a community is being created or joined (and
  // while the app starts) the entry must not open over the progress screen.
  const anotherOnboardingModalOpen =
    joinCommunityModal.open ||
    createCommunityModal.open ||
    linkDevicesModal.open ||
    createUsernameModal.open ||
    loadingPanelModal.open

  useEffect(() => {
    // An admission reset is still tearing the old community down; onboarding must not open over it.
    if (
      isConnected &&
      admissionResetStatus === 'idle' &&
      !joinCommunityError &&
      !currentCommunity &&
      !invitationCodes &&
      !getStartedModal.open &&
      !anotherOnboardingModalOpen
    ) {
      logger.info('Opening get started modal')
      getStartedModal.handleOpen()
    }
  }, [
    admissionResetStatus,
    joinCommunityError,
    isConnected,
    currentCommunity,
    invitationCodes,
    torBootstrapProcess,
    anotherOnboardingModalOpen,
  ])

  useEffect(() => {
    if (isConnected && currentCommunity && getStartedModal.open) {
      logger.info('Closing get started modal since community is joined')
      getStartedModal.handleClose()
    }
  }, [isConnected, currentCommunity, getStartedModal.open])

  const go = (modal: ReturnType<typeof useModal>) => () => {
    modal.handleOpen()
    getStartedModal.handleClose()
  }

  return (
    <Modal
      open={getStartedModal.open}
      handleClose={getStartedModal.handleClose}
      withoutTitle
      isCloseDisabled
      contentWidth={'100%'}
      testIdPrefix={'getStarted'}
      zIndex={1300}
    >
      <GetStartedComponent
        onJoinCommunity={go(joinCommunityModal)}
        onCreateCommunity={go(createCommunityModal)}
        onLinkDevices={go(linkDevicesModal)}
      />
    </Modal>
  )
}

export default GetStarted
