import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import CopyLinkComponent, { CopyLinkComponentProps } from './CopyLink.component'

const Template: ComponentStory<typeof CopyLinkComponent> = args => {
  return <CopyLinkComponent {...args} />
}

export const Component = Template.bind({})

const args: CopyLinkComponentProps = {
  invitationLink:
    'https://tryquiet.org/join?code=http://p7lrosb6fvtt7t3fhmuh5uj5twxirpngeipemdm5d32shgz46cbd3bad.onion',
  openUrl: (url: string) => console.log(url)
}

Component.args = args

const component: ComponentMeta<typeof CopyLinkComponent> = {
  title: 'Components/CopyLink',
  decorators: [withTheme],
  component: CopyLinkComponent
}

export default component
