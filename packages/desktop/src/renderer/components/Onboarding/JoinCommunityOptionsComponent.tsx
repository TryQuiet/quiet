import React from 'react'
import { styled } from '@mui/material/styles'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { HEART_CHAT_SIZE, heartChatIllustration, onboardingIcons } from './icons'
import {
  JOIN_COMMUNITY_HEADING,
  JOIN_WITH_INVITE_LINK_HEADING,
  JOIN_WITH_QR_CODE_HEADING,
  RECOVER_ACCOUNT_HEADING,
} from '@quiet/common'

const Illustration = styled('img')({
  ...HEART_CHAT_SIZE,
})

export interface JoinCommunityOptionsComponentProps {
  onJoinWithInviteLink: () => void
  onJoinWithQrCode: () => void
  onRecoverAccount: () => void
}

/**
 * Join community · Figma 2811:2562: the heart-chat illustration directly under
 * the bar, the title 24 below it, then the three-way choice (graphic at y 60,
 * title at 244, rows from 302 in the frame). "Recover account" opens the
 * Account recovery screen (2811:2535), whose routes are the existing Link
 * devices and Join with invite link flows.
 */
export const JoinCommunityOptionsComponent: React.FC<JoinCommunityOptionsComponentProps> = ({
  onJoinWithInviteLink,
  onJoinWithQrCode,
  onRecoverAccount,
}) => (
  <OnboardingBody
    leading={<Illustration src={heartChatIllustration} alt='' aria-hidden data-testid='join-community-graphic' />}
    flushLeading
    heading={JOIN_COMMUNITY_HEADING}
    dataTestId='join-community-options'
  >
    <RowGroup>
      <ActionRow
        icon={onboardingIcons.inviteLink}
        label={JOIN_WITH_INVITE_LINK_HEADING}
        onClick={onJoinWithInviteLink}
        dataTestId='join-with-invite-link'
      />
      <ActionRow
        icon={onboardingIcons.qrCode}
        label={JOIN_WITH_QR_CODE_HEADING}
        onClick={onJoinWithQrCode}
        dataTestId='join-with-qr-code'
      />
      <ActionRow
        icon={onboardingIcons.info}
        label={RECOVER_ACCOUNT_HEADING}
        onClick={onRecoverAccount}
        dataTestId='recover-account'
      />
    </RowGroup>
  </OnboardingBody>
)

export default JoinCommunityOptionsComponent
