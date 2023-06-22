import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import { useModal } from '../../../containers/hooks'
import { PublicChannel } from '@quiet/types'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import ChannelsListItem from './ChannelsListItem'

export interface ChannelsPanelProps {
  channels: PublicChannel[]
  unreadChannels: string[]
  setCurrentChannel: (id: string) => void
  currentChannelId: string
  createChannelModal: ReturnType<typeof useModal>
}

const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  unreadChannels,
  setCurrentChannel,
  currentChannelId,
  createChannelModal,
}) => {
  return (
    <Grid container item xs direction='column'>
      <Grid item>
        <SidebarHeader
          title={'Channels'}
          action={createChannelModal.handleOpen}
          actionTitle={createChannelModal.handleOpen}
          tooltipText='Create new channel'
        />
      </Grid>
      <Grid item>
        <List disablePadding data-testid='channelsList'>
          {channels.map((channel, _index) => {
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
      </Grid>
      {/* <Grid item>
        <QuickActionButton
          text='Find Channel'
          action={}
          icon={<Icon src={SearchIcon} />}
        />
      </Grid> */}
    </Grid>
  )
}
export default ChannelsPanel
