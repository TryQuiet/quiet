import React, { FC } from 'react'
import { InvitationDataVersion, type DeviceInvitationData } from '@quiet/types'

import { AgreeAndJoin } from '../AgreeAndJoin/AgreeAndJoin.component'
import { Typography } from '../Typography/Typography.component'

export interface DeviceLinkConsentProps {
  inviteData: DeviceInvitationData
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * The "use Quiet's server?" step, as the design draws it: the Agree & join
 * screen (3054:4090) — a titled bar, a left-aligned body naming the host, and
 * one pill. The back arrow is the way out and the caller maps it to declining.
 *
 * The body is not the terms copy. Linking a device hands the other device this
 * account, and when the invite carries a QSS endpoint the app contacts that
 * host directly, so the copy says what that exposes. Wording is develop's,
 * unchanged.
 */
export const DeviceLinkConsent: FC<DeviceLinkConsentProps> = ({ inviteData, visible, onConfirm, onCancel }) => {
  if (!visible) return null

  const qssEndpoint =
    inviteData.version === InvitationDataVersion.v5 && inviteData.qssEnabled ? inviteData.qssEndpoint : undefined

  return (
    <AgreeAndJoin
      onAgree={onConfirm}
      onBack={onCancel}
      agreeLabel='Link device'
      testID='device-link-consent'
      agreeTestID='device-link-confirm'
    >
      <Typography variant={'body'}>
        {qssEndpoint
          ? `Quiet will contact ${qssEndpoint} directly. That server can see your IP address. Continue only if you trust this endpoint and the person who shared the link.`
          : 'Quiet will connect to the linked device over Tor. Continue only if you trust the person who shared the link.'}
      </Typography>
    </AgreeAndJoin>
  )
}

export default DeviceLinkConsent
