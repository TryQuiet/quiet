import React from 'react'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { onboardingIcons } from './icons'

export interface JoinCommunityOptionsComponentProps {
  onJoinWithInviteLink: () => void
  onJoinWithQrCode: () => void
}

/**
 * Join community · Figma 2811:2562: the three-way choice. "Recover account"
 * has no mechanism yet, so its row is present but disabled.
 */
export const JoinCommunityOptionsComponent: React.FC<JoinCommunityOptionsComponentProps> = ({
  onJoinWithInviteLink,
  onJoinWithQrCode,
}) => (
  <OnboardingBody heading={'Join community'} dataTestId='join-community-options'>
    <RowGroup>
      <ActionRow
        icon={onboardingIcons.inviteLink}
        label={'Join with invite link'}
        onClick={onJoinWithInviteLink}
        dataTestId='join-with-invite-link'
      />
      <ActionRow
        icon={onboardingIcons.qrCode}
        label={'Join with QR code'}
        onClick={onJoinWithQrCode}
        dataTestId='join-with-qr-code'
      />
      <ActionRow icon={onboardingIcons.info} label={'Recover account'} disabled dataTestId='recover-account' />
    </RowGroup>
  </OnboardingBody>
)

export default JoinCommunityOptionsComponent
