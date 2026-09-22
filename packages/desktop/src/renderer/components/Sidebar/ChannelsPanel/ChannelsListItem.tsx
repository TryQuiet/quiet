import React from 'react'
import { PublicChannel } from '@quiet/types'
import ChannelTypeIcon from '../../widgets/channels/ChannelTypeIcon'
import SidebarRow from '../../ui/Sidebar/SidebarRow'
import SidebarUnreadBadge from '../../ui/Sidebar/SidebarUnreadBadge'

export interface ChannelsListItemProps {
  channel: PublicChannel
  unread: boolean
  selected: boolean
  setCurrentChannel: (name: string) => void
  disabled: boolean
}

/**
 * One channel in the sidebar's "Channels" section — the Quiet Design Library's
 * `List item` (`3797:16113`), with the library's `#` and lock glyphs.
 */
export const ChannelsListItem: React.FC<ChannelsListItemProps> = ({
  channel,
  unread,
  selected,
  setCurrentChannel,
  disabled = false,
}) => {
  const isPublic = channel.public ?? true

  return (
    <SidebarRow
      label={channel.name}
      selected={selected}
      unread={unread}
      disabled={disabled}
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      data-testid={`${channel.name}-link`}
      labelTestId={`${channel.name}-channel-link-text`}
      glyph={
        <ChannelTypeIcon
          isPublic={isPublic}
          fill={'currentColor'}
          // The library draws the glyph at 7 x 8 inside its 12px box; these
          // icons carry a 24 viewBox, so 14px reproduces that size.
          style={{ fontSize: 14 }}
          data-testid={`${channel.name}-channel-link-icon-${isPublic ? 'public' : 'private'}`}
        />
      }
      badge={unread ? <SidebarUnreadBadge data-testid={`${channel.name}-channel-link-unread`} /> : undefined}
    />
  )
}

export default ChannelsListItem
