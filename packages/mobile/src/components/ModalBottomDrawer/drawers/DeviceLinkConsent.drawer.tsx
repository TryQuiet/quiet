import React from 'react'
import type { DeviceInvitationData } from '@quiet/types'

import DeviceLinkConsent from '../../DeviceLinkConsent/DeviceLinkConsent.component'
import { ModalBottomDrawer } from '../ModalBottomDrawer.component'

export interface DeviceLinkConsentDrawerProps {
  inviteData: DeviceInvitationData | undefined
  onConfirm: () => void
  onCancel: () => void
}

export const DeviceLinkConsentDrawer: React.FC<DeviceLinkConsentDrawerProps> = ({
  inviteData,
  onConfirm,
  onCancel,
}) => {
  const visible = Boolean(inviteData)

  return (
    <ModalBottomDrawer
      visible={visible}
      onClose={onCancel}
      showHandle
      testIdPrefix='device-link-consent-drawer'
      heightRatio={2 / 3}
    >
      {inviteData && (
        <DeviceLinkConsent inviteData={inviteData} visible={visible} onConfirm={onConfirm} onCancel={onCancel} />
      )}
    </ModalBottomDrawer>
  )
}

export default DeviceLinkConsentDrawer
