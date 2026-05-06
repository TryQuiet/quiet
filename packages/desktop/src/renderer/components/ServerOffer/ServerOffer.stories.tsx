import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import { ServerOfferComponent, ServerOfferComponentProps } from './ServerOfferComponent'

const Template: ComponentStory<typeof ServerOfferComponent> = args => {
  return <ServerOfferComponent {...args} />
}

export const Component = Template.bind({})

const args: ServerOfferComponentProps = {
  open: true,
  handleClose: selection => {
    // eslint-disable-next-line no-console
    console.info('ServerOffer closed with selection:', selection)
  },
  showDontShowAgain: true,
}

Component.args = args

const component: ComponentMeta<typeof ServerOfferComponent> = {
  title: 'Components/ServerOffer',
  decorators: [withTheme],
  component: ServerOfferComponent,
}

export default component
