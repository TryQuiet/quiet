import React, { useCallback, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { createLogger } from '../../logger'

const logger = createLogger('ServerAddedModal')

import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { clearCommunity } from '../..'

import { communities } from '@quiet/state-manager'

import { ServerAddedComponent } from './ServerAddedComponent'

const ServerAddedModal = () => {
  const dispatch = useDispatch()

  const modal = useModal(ModalName.serverAddedModal)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const serverHosts = currentCommunity?.serverHosts || []

  useEffect(() => {
    if (modal.open && serverHosts.length === 0) {
      logger.warn('ServerAddedModal opened but no serverHosts found in current community, closing modal')
      modal.handleClose()
      return
    }
    if (serverHosts.length > 0 && !modal.open && currentCommunity && !currentCommunity.qssEnabled) {
      logger.warn('Opening ServerAddedModal because serverHosts unexpectedly found in current community')
      modal.handleOpen()
      return
    }
  }, [modal, serverHosts])

  const handleChoose = useCallback(
    (useServer: boolean) => {
      if (!currentCommunity) {
        logger.warn('No current community found when handling server choice')
        return
      }
      if (useServer) {
        dispatch(
          communities.actions.updateCommunityData({
            id: currentCommunity.id,
            qssEnabled: true,
          })
        )
      } else {
        clearCommunity()
      }
      modal.handleClose()
    },
    [currentCommunity, dispatch]
  )

  return <ServerAddedComponent {...modal} onChoose={handleChoose} serverHosts={serverHosts} />
}
