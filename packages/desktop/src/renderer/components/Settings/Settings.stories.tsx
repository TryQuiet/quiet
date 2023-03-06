import React, { FC, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import { SettingsComponent, SettingsComponentProps } from './SettingsComponent'

import { About } from '../widgets/Settings/About'

import { InviteComponent } from './Tabs/Invite/InviteComponent'

import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'

const Template: ComponentStory<typeof SettingsComponent> = args => {
  return <SettingsComponent {...args} />
}

export const Component = Template.bind({})

const Leave: FC = () => {
  return (
    <LeaveCommunityComponent
      communityName={'Rockets'}
      leaveCommunity={jest.fn()}
      open={false}
      handleClose={jest.fn()}
    />
  )
}

const Invite: FC = () => {
  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)
  return (
    <InviteComponent
      communityName={'Rockets'}
      invitationUrl={'ytzoaxku26gobduqogx6ydhezgf6aumpcted27qx7tz6z77lzj2zb6ad'}
      revealInputValue={revealInputValue}
      handleClickInputReveal={() => {
        setRevealInputValue(!revealInputValue)
      }}
    />
  )
}

const args: SettingsComponentProps = {
  open: true,
  handleClose: function (): void {},
  owner: true,
  tabs: {
    about: About,
    notifications: About, // Unfortunatelly notifications component causes story to crash
    invite: Invite,
    leave: Leave
  },
  leaveCommunityModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  }
}

Component.args = args

const component: ComponentMeta<typeof SettingsComponent> = {
  title: 'Components/Settings',
  decorators: [withTheme],
  component: SettingsComponent
}

export default component
