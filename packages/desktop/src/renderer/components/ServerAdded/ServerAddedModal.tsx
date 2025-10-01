import React, { useCallback, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { createLogger } from '../../logger'

const logger = createLogger('ServerAddedModal')

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { clearCommunity } from '../..'

import { communities } from '@quiet/state-manager'

import { ServerAddedComponent } from './ServerAddedComponent'

export const ServerAddedModal = () => {
  const dispatch = useDispatch()

  const modal = useModal(ModalName.serverAddedModal)

  const unacceptedServers = useSelector(communities.selectors.unacceptedServers)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)

  useEffect(() => {
    if (modal.open && unacceptedServers.length === 0) {
      logger.warn('ServerAddedModal opened but no unacceptedServers found in current community, closing modal')
      modal.handleClose()
      return
    }
    if (unacceptedServers.length > 0 && !modal.open) {
      logger.warn('Opening ServerAddedModal because unacceptedServers unexpectedly found in current community')
      modal.handleOpen()
      return
    }
  }, [modal, unacceptedServers])

  const handleChoose = useCallback(
    (useServer: boolean) => {
      if (!currentCommunity) {
        logger.warn('No current community found when handling server choice')
        return
      }
      if (useServer) {
        const updateCommunityPayload = {
          id: currentCommunity.id,
          qssEnabled: true,
          serverHosts: currentCommunity.serverHosts?.map(sh => ({ ...sh, accepted: true })),
        }
        if (!currentCommunity.tosAccepted) {
          dispatch(communities.actions.requestTermsOfService())
        }
        dispatch(communities.actions.updateCommunityData(updateCommunityPayload))
      } else {
        clearCommunity()
      }
      modal.handleClose()
    },
    [currentCommunity, dispatch]
  )

  return <ServerAddedComponent {...modal} onChoose={handleChoose} serverHosts={unacceptedServers} />
}

export default ServerAddedModal
