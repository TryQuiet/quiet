import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { socketSelectors } from '../../../sagas/socket/socket.selectors'
import { communities } from '@quiet/state-manager'
import { CommunityOwnership, CreateCommunityPayload } from '@quiet/types'
import PerformCommunityActionComponent from '../PerformCommunityActionComponent'
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
  const joinCommunityModal = useModal(ModalName.joinCommunityModal)
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

  // From 'You can join a community instead' link
  const handleRedirection = () => {
    if (!joinCommunityModal.open) {
      joinCommunityModal.handleOpen()
      createCommunityModal.handleClose()
    } else {
      createCommunityModal.handleClose()
    }
  }

  return (
    <>
      <PerformCommunityActionComponent
        {...createCommunityModal}
        communityOwnership={CommunityOwnership.Owner}
        handleCommunityAction={handleCommunityAction}
        handleRedirection={handleRedirection}
        isConnectionReady={isConnected}
        isCloseDisabled={!currentCommunity}
        hasReceivedResponse={Boolean(currentCommunity)}
        revealInputValue={true}
      />
      {showServerOffer && <ServerOfferComponent open={showServerOffer} handleClose={handleServerOfferClose} />}
    </>
  )
}

export default CreateCommunity
