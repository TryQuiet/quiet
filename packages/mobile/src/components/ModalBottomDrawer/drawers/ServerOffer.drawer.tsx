import React, { useState, useCallback } from 'react'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'
import ServerOffer from '../../ServerOffer/CreatingOffer/ServerOffer.component'

export interface ServerOfferDrawerProps {
  visible: boolean
  onClose: (useServer: boolean, dontShowAgain: boolean) => void
  showDontShowAgain: boolean
}

export const ServerOfferDrawer: React.FC<ServerOfferDrawerProps> = ({ visible, onClose, showDontShowAgain }) => {
  // Encapsulate the checkbox state so the parent doesn't manage it
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Backdrop or swipe-down → treat as Not now, forwarding the current DSA value
  // When the drawer is dismissed by backdrop/swipe, treat it as “Not now” but
  // still forward the current DSA value
  const handleDrawerClose = useCallback(() => onClose(false, dontShowAgain), [onClose, dontShowAgain])

  // When the child component fires an explicit decision, forward both values
  const handleOfferClose = useCallback(
    (useServer: boolean, dsaFromChild: boolean) => {
      // stay in sync if child toggled and pressed a button immediately
      if (dsaFromChild !== dontShowAgain) setDontShowAgain(dsaFromChild)
      onClose(useServer, dsaFromChild)
    },
    [onClose, dontShowAgain]
  )

  return (
    <ModalBottomDrawer
      visible={visible}
      onClose={handleDrawerClose}
      title=''
      showHandle
      testIdPrefix='server-offer-drawer'
      heightRatio={2 / 3}
    >
      <ServerOffer
        visible={visible}
        onClose={handleOfferClose}
        handleDontShowAgainChange={setDontShowAgain}
        showDontShowAgain={showDontShowAgain}
      />
    </ModalBottomDrawer>
  )
}

export default ServerOfferDrawer
