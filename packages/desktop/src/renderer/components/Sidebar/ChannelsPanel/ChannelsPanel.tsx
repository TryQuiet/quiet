import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import { useModal } from '../../../containers/hooks'
import { PublicChannel, UserProfile } from '@quiet/types'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import ChannelsListItem from './ChannelsListItem'
import UserProfileListItem from './UserProfileListItem'

export interface ChannelsPanelProps {
  channels: PublicChannel[]
  myUserProfile?: UserProfile
  userProfiles: Record<string, UserProfile>
  connectedPeers: string[]
  unreadChannels: string[]
  setCurrentChannel: (id: string) => void
  currentChannelId: string
  createChannelModal: ReturnType<typeof useModal>
  isTorInitialized: boolean
}

const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  myUserProfile,
  userProfiles,
  connectedPeers,
  unreadChannels,
  setCurrentChannel,
  currentChannelId,
  createChannelModal,
  isTorInitialized,
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
      {/* Users Section */}
      <Grid item sx={{ mt: 2 }}>
        <SidebarHeader title={'Users'} tooltipText='List of users in this workspace' />
        <List disablePadding data-testid='usersList'>
          {myUserProfile && (
            <UserProfileListItem user={myUserProfile} key={myUserProfile.userId} connected={isTorInitialized} />
          )}
          {Object.values(userProfiles)
            .filter(user => !myUserProfile || user.userId !== myUserProfile.userId)
            .sort((a, b) => {
              const aConnected = !!(a.userData && a.userData.peerId && connectedPeers.includes(a.userData.peerId))
              const bConnected = !!(b.userData && b.userData.peerId && connectedPeers.includes(b.userData.peerId))
              if (aConnected === bConnected) {
                return a.nickname.localeCompare(b.nickname, undefined, { sensitivity: 'base' })
              }
              return aConnected ? -1 : 1
            })
            .map(user => (
              <UserProfileListItem
                user={user}
                key={user.userId}
                connected={!!(user.userData && user.userData.peerId && connectedPeers.includes(user.userData.peerId))}
              />
            ))}
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
