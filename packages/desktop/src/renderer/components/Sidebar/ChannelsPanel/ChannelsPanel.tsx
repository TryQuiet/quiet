import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import { useCyclingFocus, useModal } from '../../../containers/hooks'
import { PublicChannel } from '@quiet/state-manager'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import ChannelsListItem from './ChannelsListItem'

export interface ChannelsPanelProps {
  channels: PublicChannel[]
  unreadChannels: string[]
  setCurrentChannel: (address: string) => void
  currentChannel: string
  createChannelModal: ReturnType<typeof useModal>
}

const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  unreadChannels,
  setCurrentChannel,
  currentChannel,
  createChannelModal
}) => {
  const [focusedIndex] = useCyclingFocus(channels.length)
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
        <List disablePadding>
          {channels.map((channel, index) => {
            const unread = unreadChannels.some(address => address === channel.address)
            const selected = currentChannel === channel.address
            return (
              <ChannelsListItem
                channel={channel}
                unread={unread}
                selected={selected}
                focused={focusedIndex === index}
                setCurrentChannel={setCurrentChannel}
                key={channel.address}
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
