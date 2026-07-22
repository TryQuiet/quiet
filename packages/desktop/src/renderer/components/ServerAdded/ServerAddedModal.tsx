import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { createLogger } from '../../logger'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { clearCommunity } from '../../clearCommunity'
import { communities } from '@quiet/state-manager'
import { ServerAddedComponent } from './ServerAddedComponent'

const logger = createLogger('ServerAddedModal')

export const ServerAddedModal = () => {
  const dispatch = useDispatch()

  const modal = useModal(ModalName.serverAddedModal)

  const unacceptedServers = useSelector(communities.selectors.unacceptedServers)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const tosRequested = useSelector(communities.selectors.tosRequested)

  useEffect(() => {
    if (modal.open && (unacceptedServers.length === 0 || tosRequested)) {
      logger.info('Closing ServerAddedModal because no server choice is currently needed')
      modal.handleClose()
      return
    }
    if (unacceptedServers.length > 0 && !modal.open && !tosRequested) {
      logger.warn('Opening ServerAddedModal because unacceptedServers unexpectedly found in current community')
      modal.handleOpen()
      return
    }
  }, [modal, tosRequested, unacceptedServers])

  const handleChoose = useCallback(
    async (useServer: boolean) => {
      if (!currentCommunity) {
        logger.warn('No current community found when handling server choice')
        return
      }
      if (useServer) {
        dispatch(communities.actions.acceptServer())
      } else {
        await clearCommunity()
      }
      modal.handleClose()
    },
    [currentCommunity, dispatch]
  )

  return <ServerAddedComponent {...modal} onChoose={handleChoose} serverHosts={unacceptedServers} />
}

export default ServerAddedModal
