import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import { InviteComponent, InviteComponentProps } from './Invite.component'

const Template: ComponentStory<typeof InviteComponent> = args => {
  return <InviteComponent {...args} />
}

export const Component = Template.bind({})
let revealInputValue = true
const args: InviteComponentProps = {
  invitationLink: 'https://tryquiet.org/join#p7lrosb6fvtt7t3fhmuh5uj5twxirpngeipemdm5d32shgz46cbd3bad',
  revealInputValue: revealInputValue,
  handleClickInputReveal: () => {
    revealInputValue = !revealInputValue
  },
}

Component.args = args

const component: ComponentMeta<typeof InviteComponent> = {
  title: 'Components/InviteFriend',
  decorators: [withTheme],
  component: InviteComponent,
}

export default component
