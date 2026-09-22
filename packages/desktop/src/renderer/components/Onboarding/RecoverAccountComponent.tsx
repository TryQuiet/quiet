import React from 'react'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { onboardingIcons } from './icons'

export interface RecoverAccountComponentProps {
  onUseLinkedDevice: () => void
  onUseInviteLink: () => void
}

/**
 * Account recovery · Figma 2811:2535. The frame's illustration is the
 * library's "Icon=Vpn key" glyph at 64px. The prototype wires "Use linked
 * device" to Link devices and "Use invite link" to Open invite link; "More
 * options" is drawn but goes nowhere, so its row is present and inert. There
 * is no separate recovery mechanism: both routes are the existing flows.
 */
export const RecoverAccountComponent: React.FC<RecoverAccountComponentProps> = ({
  onUseLinkedDevice,
  onUseInviteLink,
}) => (
  <OnboardingBody
    leading={<img src={onboardingIcons.info} alt='' aria-hidden width={64} height={64} />}
    heading={'Recover account'}
    intro={'Locked out? You can recover with a linked device or ask an admin to send you an invite link.'}
    dataTestId='recover-account-info'
  >
    <RowGroup>
      <ActionRow
        icon={onboardingIcons.linkDevices}
        label={'Use linked device'}
        onClick={onUseLinkedDevice}
        dataTestId='recover-use-linked-device'
      />
      <ActionRow
        icon={onboardingIcons.inviteLink}
        label={'Use invite link'}
        onClick={onUseInviteLink}
        dataTestId='recover-use-invite-link'
      />
      <ActionRow icon={onboardingIcons.moreHoriz} label={'More options'} disabled dataTestId='recover-more-options' />
    </RowGroup>
  </OnboardingBody>
)

export default RecoverAccountComponent
