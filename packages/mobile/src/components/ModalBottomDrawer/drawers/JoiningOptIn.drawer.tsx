import React, { useState, useCallback } from 'react'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'
import JoiningOptIn from '../../ServerOffer/JoiningOptIn/JoiningOptIn.component'
import { communities } from '@quiet/state-manager'
import { useDispatch, useSelector } from 'react-redux'

export interface JoiningOptInDrawerProps {
  visible: boolean
  onClose: (useServer: boolean) => void
}

export const JoiningOptInDrawer: React.FC<JoiningOptInDrawerProps> = ({ visible, onClose }) => {
  // Backdrop or swipe-down → treat as Leave Community
  const waitingForOptIn = useSelector(communities.selectors.qssOptInRequested)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const handleDrawerClose = useCallback(() => onClose(false), [onClose])

  const qssEndPoint =
    invitationCodes && 'qssEndPoint' in invitationCodes ? (invitationCodes as any).qssEndPoint : undefined

  // When the child component fires an explicit decision, forward both values
  const handleChoice = useCallback(
    (useServer: boolean) => {
      onClose(useServer)
    },
    [onClose]
  )

  return (
    <ModalBottomDrawer
      visible={waitingForOptIn}
      onClose={handleDrawerClose}
      title=''
      showHandle
      testIdPrefix='joining-opt-in-drawer'
      heightRatio={2 / 3}
    >
      <JoiningOptIn visible={waitingForOptIn} onClose={handleChoice} qssEndPoint={qssEndPoint} />
    </ModalBottomDrawer>
  )
}

export default JoiningOptInDrawer
