import React from 'react'
import List from '@mui/material/List'
import { useModal } from '../../../containers/hooks'
import { PublicChannel, UserProfile } from '@quiet/types'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import ChannelsListItem from './ChannelsListItem'

export interface ChannelsPanelProps {
  channels: PublicChannel[]
  userProfiles: Record<string, UserProfile>
  connectedPeers: string[]
  unreadChannels: string[]
  setCurrentChannel: (id: string) => void
  currentChannelId: string
  createChannelModal: ReturnType<typeof useModal>
  isTorInitialized: boolean
  canCreateChannel: boolean
}

/**
 * The "Channels" section of the Quiet Design Library's desktop sidebar
 * (`6218:16416`): a `List title` with the section's (+), then one `List item`
 * per channel.
 */
const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  unreadChannels,
  canCreateChannel,
  setCurrentChannel,
  currentChannelId,
  createChannelModal,
}) => {
  return (
    <div>
      <SidebarHeader
        title={'Channels'}
        // The (+) is only drawn for users who may actually create a channel.
        action={canCreateChannel ? createChannelModal.handleOpen : undefined}
        tooltipText='Create new channel'
      />
      <List disablePadding data-testid='channelsList'>
        {channels.map(channel => {
          const unread = unreadChannels.some(id => id === channel.id)
          const selected = currentChannelId === channel.id
          return (
            <ChannelsListItem
              channel={channel}
              unread={unread}
              selected={selected}
              setCurrentChannel={setCurrentChannel}
              key={channel.id}
              disabled={Boolean(channel.disabled)}
            />
          )
        })}
      </List>
    </div>
  )
}
export default ChannelsPanel
