import React from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import DirectMessageListItem from './DirectMessageListItem'
import { DeviceNetworkEndpoint, PublicChannelStorage, UserProfile } from '@quiet/types'
import _ from 'lodash'

export interface DirectMessagesPanelProps {
  myUserProfile?: UserProfile
  userProfiles: Record<string, UserProfile>
  dmChannels: PublicChannelStorage[]
  unreadDms: string[]
  currentChannelId: string
  connectedPeers: string[]
  networkEndpoints: DeviceNetworkEndpoint[]
  isTorInitialized: boolean
  setCurrentChannel: (channelId: string) => void
  openNewMessageWindow: () => void
}

export interface DmChannelUserData {
  connected: boolean | undefined
  user: UserProfile
}

const getUserDataForDmChannel = (
  dmChannel: PublicChannelStorage,
  me: UserProfile | undefined,
  userProfiles: Record<string, UserProfile>,
  connectedPeers: string[]
): DmChannelUserData | undefined => {
  if (dmChannel.memberIds == null || me == null) {
    return undefined
  }

  if (dmChannel.memberIds.length === 1) {
    return {
      connected: true,
      user: me,
    }
  }

  const notMeId = _.find(dmChannel.memberIds, memberId => memberId != me.userId)
  if (notMeId == null) {
    return undefined
  }
  const userThatIsntMe = userProfiles[notMeId]
  if (userThatIsntMe == null) return undefined

  if (dmChannel.memberIds.length > 2) {
    return {
      connected: undefined,
      user: userThatIsntMe,
    }
  }

  const connected =
    userThatIsntMe.userData != null &&
    userThatIsntMe.userData.peerId != null &&
    connectedPeers.includes(userThatIsntMe.userData.peerId)
  return {
    connected,
    user: userThatIsntMe,
  }
}

const DirectMessagesPanel: React.FC<DirectMessagesPanelProps> = ({
  myUserProfile,
  userProfiles,
  dmChannels = [],
  unreadDms,
  currentChannelId,
  connectedPeers,
  networkEndpoints,
  isTorInitialized,
  setCurrentChannel,
  openNewMessageWindow,
}) => {
  const isUserConnected = (userId: string): boolean =>
    networkEndpoints.some(endpoint => endpoint.userId === userId && connectedPeers.includes(endpoint.peerId))

  return (
    <Grid container item xs direction='column'>
      <SidebarHeader
        title={'Direct messages'}
        tooltipText='Start a new DM'
        action={openNewMessageWindow}
        actionTitle={'createNewMessage'}
      />
      <List disablePadding data-testid='dm-list'>
        {dmChannels.map(channel => {
          const userData = getUserDataForDmChannel(channel, myUserProfile, userProfiles, connectedPeers)
          const unread = unreadDms.some(unreadDmId => unreadDmId === channel.id)
          const selected = currentChannelId === channel.id
          return (
            <DirectMessageListItem
              me={myUserProfile}
              userProfiles={userProfiles}
              userData={userData}
              channel={channel}
              key={channel.id}
              unread={unread}
              selected={selected}
              setCurrentChannel={setCurrentChannel}
            />
          )
        })}
      </List>
    </Grid>
  )
}

export default DirectMessagesPanel
