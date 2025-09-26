import React, { useState, useCallback } from 'react'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'
import ServerAddedComponent, { ServerAddedProps } from '../../UnexpectedServer/UnexpectedServerComponent'

export const UnexpectedServerDrawer: React.FC<ServerAddedProps> = ({ visible, onClose, serverHost }) => {
  const handleDrawerClose = useCallback(() => onClose(false), [onClose])

  // When the child component fires an explicit decision, forward both values
  const handleOfferClose = useCallback(
    (useServer: boolean) => {
      onClose(useServer)
    },
    [onClose]
  )

  return (
    <ModalBottomDrawer
      visible={visible}
      onClose={handleDrawerClose}
      title='Server Added'
      showHandle
      testIdPrefix='unexpected-server-drawer'
      heightRatio={3 / 4}
    >
      <ServerAddedComponent visible={visible} onClose={handleOfferClose} serverHost={serverHost} />
    </ModalBottomDrawer>
  )
}

export default UnexpectedServerDrawer
