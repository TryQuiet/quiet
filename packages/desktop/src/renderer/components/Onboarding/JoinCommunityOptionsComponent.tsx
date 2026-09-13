import React from 'react'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { onboardingIcons } from './icons'

export interface JoinCommunityOptionsComponentProps {
  onJoinWithInviteLink: () => void
  onJoinWithQrCode: () => void
  onRecoverAccount: () => void
}

/**
 * Join community · Figma 2811:2562: the three-way choice. "Recover account"
 * opens the Account recovery screen (2811:2535), whose routes are the
 * existing Link devices and Join with invite link flows.
 */
export const JoinCommunityOptionsComponent: React.FC<JoinCommunityOptionsComponentProps> = ({
  onJoinWithInviteLink,
  onJoinWithQrCode,
  onRecoverAccount,
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
      <ActionRow
        icon={onboardingIcons.info}
        label={'Recover account'}
        onClick={onRecoverAccount}
        dataTestId='recover-account'
      />
    </RowGroup>
  </OnboardingBody>
)

export default JoinCommunityOptionsComponent
