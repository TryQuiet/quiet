import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import { ServerOfferComponent, ServerOfferComponentProps } from './ServerOfferComponent'

const Template: ComponentStory<typeof ServerOfferComponent> = args => {
  return <ServerOfferComponent {...args} />
}

const args: ServerOfferComponentProps = {
  open: true,
  handleClose: (useServer, dontShowAgain) => {
    // eslint-disable-next-line no-console
    console.info('ServerOffer decided:', { useServer, dontShowAgain })
  },
  handleBack: () => {
    // eslint-disable-next-line no-console
    console.info('ServerOffer went back to the step before')
  },
}

/** The offer as the app shows it during community creation: no "Don't show this again". */
export const Component = Template.bind({})
Component.args = args
Component.storyName = 'Want a server?'

/** The frame in full (2922:10009): the rule and the checkbox below the actions. */
export const WithDontShowAgain = Template.bind({})
WithDontShowAgain.args = { ...args, showDontShowAgain: true }
WithDontShowAgain.storyName = "With Don't show this again"

/** The same with the box ticked — the library's checkbox filled in gray 50. */
export const DontShowAgainChecked = Template.bind({})
DontShowAgainChecked.args = { ...args, showDontShowAgain: true, defaultDontShowAgain: true }
DontShowAgainChecked.storyName = "Don't show this again, checked"

const component: ComponentMeta<typeof ServerOfferComponent> = {
  title: 'Components/ServerOffer',
  decorators: [withTheme],
  component: ServerOfferComponent,
  // As every design-library entry does.
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
