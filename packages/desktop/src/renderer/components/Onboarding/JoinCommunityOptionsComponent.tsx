import React from 'react'
import { styled } from '@mui/material/styles'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { HEART_CHAT_SIZE, heartChatIllustration, onboardingIcons } from './icons'

const Illustration = styled('img')({
  ...HEART_CHAT_SIZE,
})

export interface JoinCommunityOptionsComponentProps {
  onJoinWithInviteLink: () => void
  onJoinWithQrCode: () => void
}

/**
 * Join community · Figma 2811:2562: the heart-chat illustration directly under
 * the bar, the title 24 below it, then the three-way choice (graphic at y 60,
 * title at 244, rows from 302 in the frame). "Recover account"
 * has no mechanism yet, so its row is present but disabled.
 */
export const JoinCommunityOptionsComponent: React.FC<JoinCommunityOptionsComponentProps> = ({
  onJoinWithInviteLink,
  onJoinWithQrCode,
}) => (
  <OnboardingBody
    leading={<Illustration src={heartChatIllustration} alt='' aria-hidden data-testid='join-community-graphic' />}
    flushLeading
    heading={'Join community'}
    dataTestId='join-community-options'
  >
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
