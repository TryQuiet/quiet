import React from 'react'
import { ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import { GetStartedComponent } from './GetStartedComponent'
import { JoinCommunityOptionsComponent } from './JoinCommunityOptionsComponent'
import { OpenInviteLinkComponent } from './OpenInviteLinkComponent'
import { PasteLinkComponent } from './PasteLinkComponent'
import { CreateCommunityComponent } from './CreateCommunityComponent'
import { LinkDevicesComponent } from './LinkDevicesComponent'

import { createLogger } from '../../logger'

const logger = createLogger('onboarding:stories')

const noop = () => {}

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ width: 600 }}>{children}</div>

export const GetStarted = () => (
  <Body>
    <GetStartedComponent onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />
  </Body>
)

export const JoinCommunityOptions = () => (
  <Body>
    <JoinCommunityOptionsComponent onJoinWithInviteLink={noop} onJoinWithQrCode={noop} />
  </Body>
)

export const OpenInviteLink = () => (
  <Body>
    <OpenInviteLinkComponent onPasteLink={noop} />
  </Body>
)

export const PasteLink = () => (
  <Body>
    <PasteLinkComponent
      heading={'Paste a link to Join'}
      handleCommunityAction={data => logger.info('Joining community', data)}
      handleClickInputReveal={noop}
    />
  </Body>
)

export const CreateCommunity = () => (
  <Body>
    <CreateCommunityComponent handleCommunityAction={name => logger.info('Creating community', name)} />
  </Body>
)

export const LinkDevices = () => (
  <Body>
    <LinkDevicesComponent onDisplayQrCode={noop} onScanQrCode={noop} />
  </Body>
)

const component: ComponentMeta<typeof GetStartedComponent> = {
  title: 'Components/Onboarding',
  decorators: [withTheme],
  component: GetStartedComponent,
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
