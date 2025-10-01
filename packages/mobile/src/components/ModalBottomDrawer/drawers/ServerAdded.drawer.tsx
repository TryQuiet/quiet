import React, { useState, useCallback } from 'react'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'
import { useDispatch, useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'
import ServerAddedComponent from '../../ServerAdded/ServerAddedComponent'
import { nativeServicesActions } from 'packages/mobile/src/store/nativeServices/nativeServices.slice'

export const ServerAddedDrawer: React.FC = () => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const unacceptedServers = useSelector(communities.selectors.unacceptedServers)
  const visible = currentCommunity?.serverHosts?.length ? !currentCommunity.qssEnabled : false
  // When the child component fires an explicit decision, forward both values
  const handleOfferClose = useCallback(
    (useServer: boolean) => {
      if (currentCommunity) {
        dispatch(communities.actions.updateCommunityData({ id: currentCommunity.id, qssEnabled: useServer } as any))
      } else {
        dispatch(nativeServicesActions.leaveCommunity())
      }
    },
    [currentCommunity]
  )

  return (
    <ModalBottomDrawer
      visible={visible}
      onClose={() => handleOfferClose(false)}
      title='Server Added'
      showHandle
      testIdPrefix='unexpected-server-drawer'
      heightRatio={3 / 4}
    >
      <ServerAddedComponent visible={visible} onChoose={handleOfferClose} serverHosts={unacceptedServers} />
    </ModalBottomDrawer>
  )
}

export default ServerAddedDrawer
