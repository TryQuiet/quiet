import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import { InviteComponent, InviteComponentProps } from './Invite.component'

const Template: ComponentStory<typeof InviteComponent> = args => {
  return <InviteComponent {...args} />
}

export const Component = Template.bind({})

const args: InviteComponentProps = {
  invitationLink:
    'https://tryquiet.org/join?code=http://p7lrosb6fvtt7t3fhmuh5uj5twxirpngeipemdm5d32shgz46cbd3bad.onion',
  openUrl: (url: string) => console.log(url)
}

Component.args = args

const component: ComponentMeta<typeof InviteComponent> = {
  title: 'Components/InviteFriend',
  decorators: [withTheme],
  component: InviteComponent
}

export default component
