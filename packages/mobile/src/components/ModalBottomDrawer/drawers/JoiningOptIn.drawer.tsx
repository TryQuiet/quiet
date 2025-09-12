import React, { useState, useCallback } from 'react'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'
import JoiningOptIn from '../../ServerOffer/JoiningOptIn/JoiningOptIn.component'
import { communities } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'

export const JoiningOptInDrawer: React.FC = () => {
  // Backdrop or swipe-down → treat as Leave Community
  const dispatch = useDispatch()
  const waitingForOptIn = useSelector(communities.selectors.qssOptInRequested)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const handleDrawerClose = useCallback(() => dispatch(communities.actions.setQssOptInResponse(false)), [dispatch])
  // Show the drawer if we are waiting for an opt-in decision and QSS is disabled for this community
  const showDrawer = Boolean(waitingForOptIn && currentCommunity?.qssEnabled === false)

  const qssEndPoint =
    invitationCodes && 'qssEndPoint' in invitationCodes ? (invitationCodes as any).qssEndPoint : undefined

  // When the child component fires an explicit decision, forward both values
  const handleChoice = useCallback(
    (useServer: boolean) => {
      dispatch(communities.actions.setQssOptInResponse(useServer))
    },
    [dispatch]
  )

  return (
    <ModalBottomDrawer
      visible={showDrawer}
      onClose={handleDrawerClose}
      title=''
      showHandle
      testIdPrefix='joining-opt-in-drawer'
      heightRatio={2 / 3}
    >
      <JoiningOptIn visible={showDrawer} onClose={handleChoice} qssEndPoint={qssEndPoint} />
    </ModalBottomDrawer>
  )
}

export default JoiningOptInDrawer
