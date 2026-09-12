import React from 'react'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { logoIcon, onboardingIcons } from './icons'

export interface GetStartedComponentProps {
  onJoinCommunity: () => void
  onCreateCommunity: () => void
  onLinkDevices: () => void
}

/** Get started · Figma 2811:2550. */
export const GetStartedComponent: React.FC<GetStartedComponentProps> = ({
  onJoinCommunity,
  onCreateCommunity,
  onLinkDevices,
}) => (
  <OnboardingBody
    leading={<img src={logoIcon} alt='' aria-hidden width={100} height={100} />}
    heading={'Let’s get started...'}
    betaWarning
    dataTestId='get-started'
  >
    <RowGroup>
      <ActionRow
        icon={onboardingIcons.personAdd}
        label={'Join a community'}
        onClick={onJoinCommunity}
        dataTestId='get-started-join'
      />
      <ActionRow
        icon={onboardingIcons.plus}
        label={'Create a new community'}
        onClick={onCreateCommunity}
        dataTestId='get-started-create'
      />
      <ActionRow
        icon={onboardingIcons.linkDevices}
        label={'Link devices'}
        onClick={onLinkDevices}
        dataTestId='get-started-link-devices'
      />
    </RowGroup>
  </OnboardingBody>
)

export default GetStartedComponent
