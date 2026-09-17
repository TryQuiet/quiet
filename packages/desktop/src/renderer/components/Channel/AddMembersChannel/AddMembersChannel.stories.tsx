import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { User, UserProfile } from '@quiet/types'

import { withTheme } from '../../../storybook/decorators'
import { useModal } from '../../../containers/hooks'

import AddMembersChannelComponent, { AddMembersChannelProps } from './AddMembersChannelComponent'

import { createLogger } from '../../../logger'

/**
 * The last step of setting up a private channel: choosing who is in it.
 *
 * Reached from the channel's members panel, by the Add members button an admin sees there — not
 * straight from the "..." menu, and not from create-channel, whose variant of this screen is
 * unreachable. See "Private channels / Notes". Open the field to pick members — each one chosen
 * becomes a pill.
 */
const logger = createLogger('addMembersChannel:stories')

const NAMES = ['denise', 'gordon', 'annabelle', 'christopher', 'bartholomew', 'evangelina', 'maximilian']

const possibleMembers: Record<string, UserProfile> = {}
const allUsers: Record<string, User> = {}
NAMES.forEach(nickname => {
  possibleMembers[`${nickname}UserId`] = {
    userId: `${nickname}UserId`,
    nickname,
    userData: { peerId: `${nickname}PeerId`, onionAddress: `${nickname}.onion` },
    channels: [],
  }
  allUsers[`${nickname}UserId`] = { isRegistered: true, isDuplicated: false, userId: `${nickname}UserId` }
})

const Template: ComponentStory<typeof AddMembersChannelComponent> = args => {
  return <AddMembersChannelComponent {...args} />
}

const args: ReturnType<typeof useModal> & AddMembersChannelProps = {
  channelName: 'fundraising-and-events',
  channelId: 'foobar',
  allUsers,
  possibleMembers,
  addMembersToChannel: (memberIds: string[]) => {
    logger.info('adding members', memberIds)
  },
  open: true,
  // @ts-expect-error
  handleOpen: () => {},
  // @ts-expect-error
  handleClose: () => {},
}

export const Component = Template.bind({})
Component.args = args

/** Nobody left to add — everyone in the community already belongs to the channel. */
export const NoOneLeftToAdd = Template.bind({})
NoOneLeftToAdd.args = {
  ...args,
  possibleMembers: Object.fromEntries(
    Object.entries(possibleMembers).map(([id, profile]) => [id, { ...profile, channels: ['foobar'] }])
  ),
}

const component: ComponentMeta<typeof AddMembersChannelComponent> = {
  title: 'Private channels/3. Add members',
  decorators: [withTheme],
  component: AddMembersChannelComponent,
}

export default component
