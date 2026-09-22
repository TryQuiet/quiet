import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'
import { DeviceLinkConsentComponent } from './DeviceLinkConsent'

const Template: ComponentStory<typeof DeviceLinkConsentComponent> = args => <DeviceLinkConsentComponent {...args} />

export const OnAServer = Template.bind({})
OnAServer.args = {
  open: true,
  qssEndpoint: 'api.tryquiet.org',
  onCancel: () => console.info('device link declined'),
  onConfirm: () => console.info('device link confirmed'),
}
OnAServer.storyName = 'Use Quiet’s server? (the invite names a host)'

export const TorOnly = Template.bind({})
TorOnly.args = {
  open: true,
  qssEndpoint: undefined,
  onCancel: () => console.info('device link declined'),
  onConfirm: () => console.info('device link confirmed'),
}
TorOnly.storyName = 'Over Tor (the invite names no host)'

/**
 * The "use Quiet's server?" step as the design draws it (3054:4090): the Agree
 * & join card, with the body that says what contacting the named host exposes.
 */
const component: ComponentMeta<typeof DeviceLinkConsentComponent> = {
  title: 'Components/Onboarding/DeviceLinkConsent',
  decorators: [withTheme],
  component: DeviceLinkConsentComponent,
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
