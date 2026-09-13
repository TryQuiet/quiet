import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { communities } from '@quiet/state-manager'
import { CreateCommunityPayload } from '@quiet/types'
import Modal from '../../ui/Modal/Modal'
import { CreateCommunityComponent } from '../../Onboarding/CreateCommunityComponent'
import { ServerOfferComponent } from '../../ServerOffer/ServerOfferComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../../containers/hooks'
import { createLogger } from '../../../logger'

const logger = createLogger('CreateCommunity')

const CreateCommunity = () => {
  const dispatch = useDispatch()

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  const createCommunityModal = useModal(ModalName.createCommunityModal)
  const getStartedModal = useModal(ModalName.getStartedModal)
  const createUsernameModal = useModal(ModalName.createUsernameModal)
  const [pendingCommunityName, setPendingCommunityName] = useState<string | null>(null)
  const [showServerOffer, setShowServerOffer] = useState(false)

  useEffect(() => {
    // Close create community modal if community is created
    if (currentCommunity && createCommunityModal.open) {
      createCommunityModal.handleClose()
    }
    // If community is created, also close server offer
    if (currentCommunity && showServerOffer) {
      setShowServerOffer(false)
      setPendingCommunityName(null)
    }
  }, [currentCommunity])

  const handleCommunityAction = (name: string) => {
    if (currentCommunity?.name === name) {
      return
    }
    setPendingCommunityName(name)
    logger.warn('QSS settings', process.env.QSS_ALLOWED, process.env.QSS_ENDPOINT)
    const createCommunityWithoutQSS = () => {
      dispatch(communities.actions.createCommunity({ name, useServer: false }))
      createUsernameModal.handleOpen()
    }
    if (process.env.QSS_ALLOWED === 'true') {
      try {
        new URL(process.env.QSS_ENDPOINT ?? '')
        setShowServerOffer(true)
      } catch (error) {
        logger.error(
          `QSS is allowed but the endpoint is invalid (endpoint provided = "${process.env.QSS_ENDPOINT}"`,
          error
        )
        createCommunityWithoutQSS()
      }
    } else {
      createCommunityWithoutQSS()
    }
  }

  const handleServerOfferClose = (useServer: boolean) => {
    setShowServerOffer(false)
    if (pendingCommunityName) {
      const payload: CreateCommunityPayload = {
        name: pendingCommunityName,
        useServer,
      }
      logger.info('Creating community with payload:', payload)
      dispatch(communities.actions.createCommunity(payload))
      createUsernameModal.handleOpen()
    }
  }

  // Back arrow: return to Get started while there is nothing to go back into.
  const handleBack = () => {
    if (!currentCommunity) getStartedModal.handleOpen()
    createCommunityModal.handleClose()
  }

  return (
    <>
      <Modal
        open={createCommunityModal.open}
        handleClose={createCommunityModal.handleClose}
        title={'Create a community'}
        canGoBack
        handleBack={handleBack}
        alignCloseLeft
        contentWidth={'100%'}
        testIdPrefix={'createCommunity'}
        zIndex={1300}
      >
        <CreateCommunityComponent
          open={createCommunityModal.open}
          isConnectionReady={isConnected}
          handleCommunityAction={handleCommunityAction}
        />
      </Modal>
      {showServerOffer && <ServerOfferComponent open={showServerOffer} handleClose={handleServerOfferClose} />}
    </>
  )
}

export default CreateCommunity
