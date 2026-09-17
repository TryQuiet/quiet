import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { UserProfile } from '@quiet/types'

import { withTheme } from '../../../storybook/decorators'
import { useModal } from '../../../containers/hooks'

import ChannelMembershipComponent, { ChannelMembershipProps } from './ChannelMembershipComponent'

import { createLogger } from '../../../logger'

/**
 * Who belongs to a channel: the step between the "..." menu and Add members.
 *
 * One panel for everyone. Whether you may change who belongs is shown by the Add members button,
 * not by the panel's name — so an admin and a member read the same title. See "Private channels /
 * Notes" for why that departs from the design's "Permissions".
 */
const logger = createLogger('channelMembership:stories')

const NAMES = ['denise', 'gordon', 'annabelle']

const members: UserProfile[] = NAMES.map(nickname => ({
  userId: `${nickname}UserId`,
  nickname,
  channels: [],
}))

const Template: ComponentStory<typeof ChannelMembershipComponent> = args => {
  return <ChannelMembershipComponent {...args} />
}

const args: ReturnType<typeof useModal> & ChannelMembershipProps = {
  channelName: 'fundraising-and-events',
  isDm: false,
  members,
  // One member is online, to draw the presence dot the design puts on each thumbnail.
  isUserConnected: (userId: string | undefined) => userId === 'deniseUserId',
  canManage: true,
  openAddMembers: () => {
    logger.info('opening add members')
  },
  open: true,
  // @ts-expect-error
  handleOpen: () => {},
  // @ts-expect-error
  handleClose: () => {},
}

/** An admin: the list, and the button that adds to it. */
export const AsAdmin = Template.bind({})
AsAdmin.args = args

/** Everyone else: the same list, with no way to change who belongs. */
export const AsMember = Template.bind({})
AsMember.args = { ...args, canManage: false }

/**
 * A DM is named by its participants rather than by a channel name, so it takes neither the "#" nor
 * the word "channel". Nobody is a DM's admin, so the button is never here.
 */
export const InADirectMessage = Template.bind({})
InADirectMessage.args = { ...args, isDm: true, channelName: 'denise, gordon', canManage: false }

/** A private channel nobody has been added to yet — where the walkthrough starts. */
export const NobodyAddedYet = Template.bind({})
NobodyAddedYet.args = { ...args, members: [] }

const component: ComponentMeta<typeof ChannelMembershipComponent> = {
  title: 'Private channels/2. Members',
  decorators: [withTheme],
  component: ChannelMembershipComponent,
}

export default component
