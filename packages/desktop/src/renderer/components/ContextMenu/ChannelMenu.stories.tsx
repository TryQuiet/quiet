import React from 'react'
import { ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'
import { ContextMenu, ContextMenuItemList } from './ContextMenu.component'
import { ContextMenuItemProps } from './ContextMenu.types'
import LockIcon from '../../static/images/components/lock'
import { MEMBERS_IN_CHANNEL_TITLE } from '../Channel/ChannelMembership/ChannelMembershipComponent'

/**
 * The channel "..." panel, transcribed from the design (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9386).
 *
 * Membership is one row carrying the member count. Whether you can change who belongs turns on
 * admin status, not on the channel being private, and is shown inside the panel by the Add members
 * button rather than by the row's name. See "Private channels / Notes" for why this departs from
 * the design's "Permissions".
 */
const CHANNEL = 'fundraising-and-events'

const lock = <LockIcon fill='currentColor' style={{ fontSize: 16 }} />

const Panel: React.FC<{ items: ContextMenuItemProps[] }> = ({ items }) => (
  <ContextMenu visible={true} handleClose={() => undefined} title={CHANNEL} titleIcon={lock}>
    <ContextMenuItemList items={items} />
  </ContextMenu>
)

const noop = () => undefined

/** What an admin sees: the membership row, and the destructive Delete channel. */
export const AsAdmin = () => (
  <Panel
    items={[
      { title: MEMBERS_IN_CHANNEL_TITLE, suffix: '6', action: noop },
      { title: 'Delete channel', destructive: true, action: noop },
      { title: 'Export messages', action: noop },
    ]}
  />
)

/** What everyone else sees: the same row — it opens read-only — and no Delete. */
export const AsMember = () => (
  <Panel
    items={[
      { title: MEMBERS_IN_CHANNEL_TITLE, suffix: '3', action: noop },
      { title: 'Export messages', action: noop },
    ]}
  />
)

/**
 * The design's Permissions row as drawn, subtitle included. The shipped row omits "Roles and
 * members" until roles exist, since with only members it says nothing — this story is here so the
 * design's intent is not lost in the meantime. Restore the subtitle when roles ship.
 *
 * Disappearing messages, Auto-delete channel and Notifications are in the design's panel too and
 * are shown here for the same reason; none of the three is built.
 */
export const AsDesigned = () => (
  <Panel
    items={[
      { title: 'Members in this channel', suffix: '3', action: noop },
      { title: 'Permissions', subtitle: 'Roles and members', suffix: '6', action: noop },
      { title: 'Disappearing messages', suffix: 'Off', action: noop },
      { title: 'Auto-delete channel', suffix: 'Off', action: noop },
      { title: 'Notifications', subtitle: '<Selected option>', action: noop },
      { title: 'Delete channel', destructive: true, action: noop },
    ]}
  />
)
AsDesigned.parameters = {
  docs: {
    description: {
      story:
        'Not what the app renders. Everything here that the app omits is omitted because the feature behind it does not exist yet: roles, disappearing messages, auto-delete and per-channel notifications.',
    },
  },
}

const component: ComponentMeta<typeof Panel> = {
  title: 'Private channels/Channel menu',
  decorators: [withTheme],
  parameters: { layout: 'fullscreen' },
}

export default component
